"""Tenant management endpoints (Super Admin only)."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse
from src.api.deps import get_current_superuser

router = APIRouter()


@router.get("/", response_model=List[TenantResponse])
async def list_tenants(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> List[TenantResponse]:
    """List all tenants (super admin only)."""
    # TODO: Implement tenant listing
    return []


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_in: TenantCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> TenantResponse:
    """Create a new tenant (super admin only)."""
    # TODO: Implement tenant creation
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Tenant creation not yet implemented",
    )


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> TenantResponse:
    """Get tenant by ID (super admin only)."""
    # TODO: Implement tenant retrieval
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Tenant not found",
    )


@router.patch("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    tenant_in: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> TenantResponse:
    """Update tenant (super admin only)."""
    # TODO: Implement tenant update
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Tenant update not yet implemented",
    )


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> None:
    """Delete tenant (super admin only)."""
    # TODO: Implement tenant deletion (soft delete)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Tenant deletion not yet implemented",
    )

