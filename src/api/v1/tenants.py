"""Tenant management endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.db.repositories.tenant_repo import TenantRepository
from src.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse
from src.api.deps import get_current_superuser, get_platform_user

router = APIRouter()


@router.get("/", response_model=List[TenantResponse])
async def list_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_platform_user),  # Read access for all platform users
) -> List[TenantResponse]:
    """List all tenants.
    
    Accessible by all platform-level users (platform_admin, platform_user).
    """
    repo = TenantRepository(db)
    
    if search:
        tenants = await repo.search_tenants(search, skip=skip, limit=limit)
    else:
        tenants = await repo.get_all(skip=skip, limit=limit)
    
    return [TenantResponse.model_validate(t) for t in tenants]


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_in: TenantCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> TenantResponse:
    """Create a new tenant (super admin only)."""
    repo = TenantRepository(db)
    
    # Check if slug already exists
    existing = await repo.get_by_slug(tenant_in.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tenant with slug '{tenant_in.slug}' already exists",
        )
    
    # Create tenant
    tenant_data = tenant_in.model_dump()
    tenant = await repo.create(tenant_data)
    
    return TenantResponse.model_validate(tenant)


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_platform_user),  # Read access for all platform users
) -> TenantResponse:
    """Get tenant by ID.
    
    Accessible by all platform-level users (platform_admin, platform_user).
    """
    repo = TenantRepository(db)
    tenant = await repo.get(tenant_id)
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    return TenantResponse.model_validate(tenant)


@router.patch("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    tenant_in: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> TenantResponse:
    """Update tenant (super admin only)."""
    repo = TenantRepository(db)
    tenant = await repo.get(tenant_id)
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    # Update only provided fields
    update_data = tenant_in.model_dump(exclude_unset=True)
    if update_data:
        tenant = await repo.update(tenant, update_data)
    
    return TenantResponse.model_validate(tenant)


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_tenant(
    tenant_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> None:
    """Deactivate tenant (soft delete - sets is_active to False)."""
    repo = TenantRepository(db)
    tenant = await repo.get(tenant_id)
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    # Soft delete by setting is_active to False
    await repo.update(tenant, {"is_active": False})


@router.delete("/{tenant_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant_permanent(
    tenant_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> None:
    """Permanently delete tenant and all associated data.
    
    WARNING: This action cannot be undone. All users, clients, accounts,
    and other data associated with this tenant will be permanently deleted.
    """
    repo = TenantRepository(db)
    tenant = await repo.get(tenant_id)
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    
    # Prevent deletion of platform tenant
    if str(tenant_id) == "00000000-0000-0000-0000-000000000000":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete the platform tenant",
        )
    
    # Hard delete - this will cascade to related records
    await repo.delete(tenant)

