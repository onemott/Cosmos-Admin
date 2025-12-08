"""Dashboard statistics endpoints.

AUTHORIZATION MODEL:
- Platform stats (super admin): Shows tenant/user counts platform-wide.
  Does NOT show cross-tenant client/AUM data.
- Tenant stats: Shows client/AUM for the current user's tenant only.
"""

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


class PlatformStats(BaseModel):
    """Platform-level statistics (super admin view).
    
    Shows platform-wide tenant/user counts.
    Does NOT include cross-tenant client data.
    """
    
    total_tenants: int
    active_tenants: int
    total_users: int
    active_users: int


class TenantStats(BaseModel):
    """Tenant-specific statistics.
    
    Shows users, clients, and AUM for ONE tenant only.
    """
    
    total_users: int
    active_users: int
    total_clients: int
    total_aum: float
    formatted_aum: str


class CombinedDashboardStats(BaseModel):
    """Combined dashboard stats for super admin.
    
    - platform: Platform-wide stats (tenants, users)
    - my_tenant: Stats for the super admin's own tenant (clients, AUM)
    """
    
    platform: PlatformStats
    my_tenant: TenantStats


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


@router.get("/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> CombinedDashboardStats | TenantStats:
    """Get dashboard statistics.
    
    - Platform admin: Gets platform stats + their own tenant's CRM stats
    - Tenant admin/user: Gets their tenant's stats only
    """
    
    # Only platform-level admins see platform-wide stats (explicit role required)
    platform_roles = {"super_admin", "platform_admin"}
    is_platform_admin = bool(platform_roles.intersection(set(current_user.get("roles", []))))
    tenant_id = current_user.get("tenant_id")
    
    # Always get current tenant stats (for CRM data)
    user_count_query = select(func.count(User.id)).where(User.tenant_id == tenant_id)
    tenant_total_users = (await db.execute(user_count_query)).scalar() or 0
    
    active_user_query = select(func.count(User.id)).where(
        User.tenant_id == tenant_id,
        User.is_active == True
    )
    tenant_active_users = (await db.execute(active_user_query)).scalar() or 0
    
    client_count_query = select(func.count(Client.id)).where(Client.tenant_id == tenant_id)
    tenant_total_clients = (await db.execute(client_count_query)).scalar() or 0
    
    aum_query = select(func.coalesce(func.sum(Account.total_value), 0)).where(
        Account.tenant_id == tenant_id
    )
    tenant_total_aum = float((await db.execute(aum_query)).scalar() or 0)
    
    my_tenant_stats = TenantStats(
        total_users=tenant_total_users,
        active_users=tenant_active_users,
        total_clients=tenant_total_clients,
        total_aum=tenant_total_aum,
        formatted_aum=format_currency(tenant_total_aum),
    )
    
    # If not platform admin, return just tenant stats
    if not is_platform_admin:
        return my_tenant_stats
    
    # Platform admin: also get platform-wide stats (tenants + all users)
    tenant_count_query = select(func.count(Tenant.id))
    total_tenants = (await db.execute(tenant_count_query)).scalar() or 0
    
    active_tenant_query = select(func.count(Tenant.id)).where(Tenant.is_active == True)
    active_tenants = (await db.execute(active_tenant_query)).scalar() or 0
    
    all_users_query = select(func.count(User.id))
    total_users = (await db.execute(all_users_query)).scalar() or 0
    
    active_users_query = select(func.count(User.id)).where(User.is_active == True)
    active_users = (await db.execute(active_users_query)).scalar() or 0
    
    platform_stats = PlatformStats(
        total_tenants=total_tenants,
        active_tenants=active_tenants,
        total_users=total_users,
        active_users=active_users,
    )
    
    return CombinedDashboardStats(
        platform=platform_stats,
        my_tenant=my_tenant_stats,
    )


@router.get("/tenant", response_model=TenantStats)
async def get_tenant_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> TenantStats:
    """Get statistics for the current user's tenant only."""
    
    tenant_id = current_user.get("tenant_id")
    
    # Count users in tenant
    user_count_query = select(func.count(User.id)).where(User.tenant_id == tenant_id)
    total_users = (await db.execute(user_count_query)).scalar() or 0
    
    active_user_query = select(func.count(User.id)).where(
        User.tenant_id == tenant_id,
        User.is_active == True
    )
    active_users = (await db.execute(active_user_query)).scalar() or 0
    
    # Count clients in tenant (strict tenant scoping)
    client_count_query = select(func.count(Client.id)).where(Client.tenant_id == tenant_id)
    total_clients = (await db.execute(client_count_query)).scalar() or 0
    
    # Calculate tenant AUM (strict tenant scoping)
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

