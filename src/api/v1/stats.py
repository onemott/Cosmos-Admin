"""Dashboard statistics endpoints."""

from typing import Optional
from decimal import Decimal
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.db.repositories.tenant_repo import TenantRepository
from src.db.repositories.user_repo import UserRepository
from src.db.repositories.client_repo import ClientRepository
from src.api.deps import get_current_user, get_current_superuser
from src.models.tenant import Tenant
from src.models.user import User
from src.models.client import Client
from src.models.account import Account

router = APIRouter()


class DashboardStats(BaseModel):
    """Dashboard statistics response model."""
    
    total_tenants: int
    active_tenants: int
    total_users: int
    active_users: int
    total_clients: int
    total_aum: float
    formatted_aum: str


class TenantStats(BaseModel):
    """Tenant-specific statistics."""
    
    total_users: int
    active_users: int
    total_clients: int
    total_aum: float
    formatted_aum: str


def format_currency(amount: float) -> str:
    """Format amount as currency string."""
    if amount >= 1_000_000_000:
        return f"${amount / 1_000_000_000:.1f}B"
    elif amount >= 1_000_000:
        return f"${amount / 1_000_000:.1f}M"
    elif amount >= 1_000:
        return f"${amount / 1_000:.1f}K"
    else:
        return f"${amount:.2f}"


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> DashboardStats:
    """Get platform-wide dashboard statistics (super admin only)."""
    
    # Count tenants
    tenant_count_query = select(func.count(Tenant.id))
    total_tenants = (await db.execute(tenant_count_query)).scalar() or 0
    
    active_tenant_query = select(func.count(Tenant.id)).where(Tenant.is_active == True)
    active_tenants = (await db.execute(active_tenant_query)).scalar() or 0
    
    # Count users
    user_count_query = select(func.count(User.id))
    total_users = (await db.execute(user_count_query)).scalar() or 0
    
    active_user_query = select(func.count(User.id)).where(User.is_active == True)
    active_users = (await db.execute(active_user_query)).scalar() or 0
    
    # Count clients
    client_count_query = select(func.count(Client.id))
    total_clients = (await db.execute(client_count_query)).scalar() or 0
    
    # Calculate total AUM
    aum_query = select(func.coalesce(func.sum(Account.total_value), 0))
    total_aum = float((await db.execute(aum_query)).scalar() or 0)
    
    return DashboardStats(
        total_tenants=total_tenants,
        active_tenants=active_tenants,
        total_users=total_users,
        active_users=active_users,
        total_clients=total_clients,
        total_aum=total_aum,
        formatted_aum=format_currency(total_aum),
    )


@router.get("/tenant", response_model=TenantStats)
async def get_tenant_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> TenantStats:
    """Get statistics for the current user's tenant."""
    
    tenant_id = current_user.get("tenant_id")
    
    # Count users in tenant
    user_count_query = select(func.count(User.id)).where(User.tenant_id == tenant_id)
    total_users = (await db.execute(user_count_query)).scalar() or 0
    
    active_user_query = select(func.count(User.id)).where(
        User.tenant_id == tenant_id,
        User.is_active == True
    )
    active_users = (await db.execute(active_user_query)).scalar() or 0
    
    # Count clients in tenant
    client_count_query = select(func.count(Client.id)).where(Client.tenant_id == tenant_id)
    total_clients = (await db.execute(client_count_query)).scalar() or 0
    
    # Calculate tenant AUM
    aum_query = select(func.coalesce(func.sum(Account.total_value), 0)).where(
        Account.tenant_id == tenant_id
    )
    total_aum = float((await db.execute(aum_query)).scalar() or 0)
    
    return TenantStats(
        total_users=total_users,
        active_users=active_users,
        total_clients=total_clients,
        total_aum=total_aum,
        formatted_aum=format_currency(total_aum),
    )


@router.get("/health")
async def get_system_health(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get system health status."""
    
    # Check database connectivity
    try:
        await db.execute(select(1))
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    return {
        "api_server": "healthy",
        "database": db_status,
        "background_jobs": "unknown",  # Would need Celery integration
    }

