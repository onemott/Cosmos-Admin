"""Base repository with common CRUD operations."""

from typing import Any, Generic, Optional, Sequence, Type, TypeVar, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.base import Base
from src.core.tenancy import get_current_tenant_id

ModelType = TypeVar("ModelType", bound=Base)

# Sentinel value to indicate using the current tenant from context
USE_CURRENT_TENANT = "USE_CURRENT_TENANT"


class BaseRepository(Generic[ModelType]):
    """Base repository with CRUD operations."""

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        """Initialize repository with model class and session."""
        self.model = model
        self.session = session

    def _apply_tenant_filter(
        self, query, tenant_id: Union[str, None] = USE_CURRENT_TENANT
    ):
        """Apply tenant filter to query.
        
        Args:
            query: SQLAlchemy query object
            tenant_id: Tenant ID to filter by. 
                       If USE_CURRENT_TENANT (default), uses context.
                       If None, no filter is applied (super admin/system).
        """
        if not hasattr(self.model, "tenant_id"):
            return query
            
        if tenant_id == USE_CURRENT_TENANT:
            tenant_id = get_current_tenant_id()
            
        if tenant_id is not None:
            return query.where(self.model.tenant_id == tenant_id)
            
        return query

    async def get(self, id: Any) -> Optional[ModelType]:
        """Get a single record by ID.
        
        Note: This does not enforce tenancy by default as IDs are typically unique.
        However, for strict multi-tenancy, one should check the result's tenant_id.
        """
        obj = await self.session.get(self.model, id)
        if obj and hasattr(obj, "tenant_id"):
            current_tenant = get_current_tenant_id()
            if current_tenant and obj.tenant_id != current_tenant:
                return None
        return obj

    async def get_by_field(
        self, field: str, value: Any, tenant_id: Union[str, None] = USE_CURRENT_TENANT
    ) -> Optional[ModelType]:
        """Get a single record by field value."""
        query = select(self.model).where(getattr(self.model, field) == value)
        query = self._apply_tenant_filter(query, tenant_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        tenant_id: Union[str, None] = USE_CURRENT_TENANT,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[ModelType]:
        """Get all records with pagination."""
        query = select(self.model)
        query = self._apply_tenant_filter(query, tenant_id)
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def create(self, obj_in: dict[str, Any]) -> ModelType:
        """Create a new record."""
        # Auto-inject tenant_id if not present and model has it
        if hasattr(self.model, "tenant_id") and "tenant_id" not in obj_in:
            current_tenant = get_current_tenant_id()
            if current_tenant:
                obj_in["tenant_id"] = current_tenant
                
        db_obj = self.model(**obj_in)
        self.session.add(db_obj)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def update(
        self, db_obj: ModelType, obj_in: dict[str, Any]
    ) -> ModelType:
        """Update an existing record."""
        # Protected fields that shouldn't be updated via generic update
        protected_fields = {"id", "tenant_id", "created_at"}
        
        for field, value in obj_in.items():
            if field in protected_fields:
                continue
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, db_obj: ModelType) -> None:
        """Delete a record."""
        await self.session.delete(db_obj)
        await self.session.flush()

