"""Base repository with common CRUD operations."""

from typing import Any, Generic, Optional, Sequence, Type, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with CRUD operations."""

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        """Initialize repository with model class and session."""
        self.model = model
        self.session = session

    async def get(self, id: Any) -> Optional[ModelType]:
        """Get a single record by ID."""
        return await self.session.get(self.model, id)

    async def get_by_field(
        self, field: str, value: Any, tenant_id: Optional[str] = None
    ) -> Optional[ModelType]:
        """Get a single record by field value."""
        query = select(self.model).where(getattr(self.model, field) == value)
        if tenant_id and hasattr(self.model, "tenant_id"):
            query = query.where(self.model.tenant_id == tenant_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        tenant_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[ModelType]:
        """Get all records with pagination."""
        query = select(self.model)
        if tenant_id and hasattr(self.model, "tenant_id"):
            query = query.where(self.model.tenant_id == tenant_id)
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def create(self, obj_in: dict[str, Any]) -> ModelType:
        """Create a new record."""
        db_obj = self.model(**obj_in)
        self.session.add(db_obj)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def update(
        self, db_obj: ModelType, obj_in: dict[str, Any]
    ) -> ModelType:
        """Update an existing record."""
        for field, value in obj_in.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, db_obj: ModelType) -> None:
        """Delete a record."""
        await self.session.delete(db_obj)
        await self.session.flush()

