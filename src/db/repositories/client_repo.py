"""Client repository for database operations."""

from typing import Optional, Sequence
from decimal import Decimal
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.db.repositories.base import BaseRepository
from src.models.client import Client, ClientGroup
from src.models.account import Account


class ClientRepository(BaseRepository[Client]):
    """Repository for Client model operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with session."""
        super().__init__(Client, session)

    async def get_by_email(
        self, email: str, tenant_id: str
    ) -> Optional[Client]:
        """Get client by email within a tenant."""
        return await self.get_by_field("email", email, tenant_id=tenant_id)

    async def get_with_accounts(self, client_id: str) -> Optional[Client]:
        """Get client with accounts loaded."""
        query = (
            select(Client)
            .where(Client.id == client_id)
            .options(selectinload(Client.accounts))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_clients_by_tenant(
        self, tenant_id: str, skip: int = 0, limit: int = 100
    ) -> Sequence[Client]:
        """Get all clients for a specific tenant."""
        query = (
            select(Client)
            .where(Client.tenant_id == tenant_id)
            .offset(skip)
            .limit(limit)
            .order_by(Client.created_at.desc())
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_all_clients(
        self, skip: int = 0, limit: int = 100
    ) -> Sequence[Client]:
        """Get all clients across all tenants (super admin only)."""
        query = (
            select(Client)
            .offset(skip)
            .limit(limit)
            .order_by(Client.created_at.desc())
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def count_all(self) -> int:
        """Count all clients."""
        query = select(func.count(Client.id))
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def count_by_tenant(self, tenant_id: str) -> int:
        """Count clients in a specific tenant."""
        query = select(func.count(Client.id)).where(
            Client.tenant_id == tenant_id
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def search_clients(
        self,
        search: str,
        tenant_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[Client]:
        """Search clients by name, email, or entity name."""
        query = select(Client).where(
            (Client.email.ilike(f"%{search}%"))
            | (Client.first_name.ilike(f"%{search}%"))
            | (Client.last_name.ilike(f"%{search}%"))
            | (Client.entity_name.ilike(f"%{search}%"))
        )
        if tenant_id:
            query = query.where(Client.tenant_id == tenant_id)
        query = query.offset(skip).limit(limit).order_by(Client.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_total_aum(self, tenant_id: Optional[str] = None) -> Decimal:
        """Get total assets under management."""
        query = select(func.coalesce(func.sum(Account.total_value), 0))
        if tenant_id:
            query = query.where(Account.tenant_id == tenant_id)
        result = await self.session.execute(query)
        return Decimal(str(result.scalar() or 0))

    async def get_client_aum(self, client_id: str) -> Decimal:
        """Get total AUM for a specific client."""
        query = select(func.coalesce(func.sum(Account.total_value), 0)).where(
            Account.client_id == client_id
        )
        result = await self.session.execute(query)
        return Decimal(str(result.scalar() or 0))


class ClientGroupRepository(BaseRepository[ClientGroup]):
    """Repository for ClientGroup model operations."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with session."""
        super().__init__(ClientGroup, session)

    async def get_groups_by_tenant(
        self, tenant_id: str, skip: int = 0, limit: int = 100
    ) -> Sequence[ClientGroup]:
        """Get all client groups for a specific tenant."""
        query = (
            select(ClientGroup)
            .where(ClientGroup.tenant_id == tenant_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

