"""Module/feature flag endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.api.deps import get_current_user, get_current_superuser

router = APIRouter()


@router.get("/")
async def list_modules(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> List[dict]:
    """List available modules for current tenant."""
    return []


@router.get("/all")
async def list_all_modules(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> List[dict]:
    """List all modules (super admin only)."""
    return []


@router.post("/{module_id}/enable")
async def enable_module(
    module_id: str,
    tenant_id: str = None,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> dict:
    """Enable a module for a tenant (super admin only)."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Module enabling not yet implemented",
    )


@router.post("/{module_id}/disable")
async def disable_module(
    module_id: str,
    tenant_id: str = None,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_superuser),
) -> dict:
    """Disable a module for a tenant (super admin only)."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Module disabling not yet implemented",
    )

