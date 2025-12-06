"""Tenant repository for database operations."""

from typing import Optional, Sequence
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.repositories.base import BaseRepository
from src.models.tenant import Tenant


class TenantRepository(BaseRepository[Tenant]):
    """Repository for Tenant model operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with session."""
        super().__init__(Tenant, session)

    async def get_by_slug(self, slug: str) -> Optional[Tenant]:
        """Get tenant by slug."""
        return await self.get_by_field("slug", slug)

    async def get_active_tenants(
        self, skip: int = 0, limit: int = 100
    ) -> Sequence[Tenant]:
        """Get all active tenants with pagination."""
        query = (
            select(Tenant)
            .where(Tenant.is_active == True)
            .offset(skip)
            .limit(limit)
            .order_by(Tenant.created_at.desc())
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def count_all(self) -> int:
        """Count all tenants."""
        query = select(func.count(Tenant.id))
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def count_active(self) -> int:
        """Count active tenants."""
        query = select(func.count(Tenant.id)).where(Tenant.is_active == True)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def search_tenants(
        self, search: str, skip: int = 0, limit: int = 100
    ) -> Sequence[Tenant]:
        """Search tenants by name or slug."""
        query = (
            select(Tenant)
            .where(
                (Tenant.name.ilike(f"%{search}%"))
                | (Tenant.slug.ilike(f"%{search}%"))
            )
            .offset(skip)
            .limit(limit)
            .order_by(Tenant.name)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

