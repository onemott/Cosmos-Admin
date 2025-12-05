"""User management endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.schemas.user import UserCreate, UserUpdate, UserResponse
from src.api.deps import get_current_user, get_current_tenant_admin

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Get current user information."""
    # TODO: Implement current user retrieval
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="User retrieval not yet implemented",
    )


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_tenant_admin),
) -> List[UserResponse]:
    """List users in current tenant."""
    # TODO: Implement user listing
    return []


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_tenant_admin),
) -> UserResponse:
    """Create a new user in current tenant."""
    # TODO: Implement user creation
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="User creation not yet implemented",
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Get user by ID."""
    # TODO: Implement user retrieval with authorization check
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found",
    )


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_tenant_admin),
) -> UserResponse:
    """Update user."""
    # TODO: Implement user update
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="User update not yet implemented",
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_tenant_admin),
) -> None:
    """Delete user (soft delete)."""
    # TODO: Implement user deletion
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="User deletion not yet implemented",
    )

