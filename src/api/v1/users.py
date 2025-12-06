"""User management endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.db.repositories.user_repo import UserRepository
from src.schemas.user import UserCreate, UserUpdate, UserResponse
from src.api.deps import get_current_user, get_current_tenant_admin, get_current_superuser
from src.core.config import settings

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Get current user information."""
    repo = UserRepository(db)
    
    # In dev mode, return mock user data
    if settings.debug and current_user.get("user_id") == "00000000-0000-0000-0000-000000000001":
        return UserResponse(
            id="00000000-0000-0000-0000-000000000001",
            email="dev@eam-platform.local",
            first_name="Dev",
            last_name="User",
            tenant_id="00000000-0000-0000-0000-000000000000",
            is_active=True,
            is_superuser=True,
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
        )
    
    user = await repo.get(current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return UserResponse.model_validate(user)


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_admin),
) -> List[UserResponse]:
    """List users. Super admins see all users, others see only their tenant's users."""
    repo = UserRepository(db)
    
    is_super_admin = "super_admin" in current_user.get("roles", [])
    tenant_id = None if is_super_admin else current_user.get("tenant_id")
    
    if search:
        users = await repo.search_users(search, tenant_id=tenant_id, skip=skip, limit=limit)
    elif tenant_id:
        users = await repo.get_users_by_tenant(tenant_id, skip=skip, limit=limit)
    else:
        users = await repo.get_all_users(skip=skip, limit=limit)
    
    return [UserResponse.model_validate(u) for u in users]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_admin),
) -> UserResponse:
    """Create a new user in current tenant."""
    repo = UserRepository(db)
    
    # Check if email already exists
    existing = await repo.get_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{user_in.email}' already exists",
        )
    
    # Prepare user data
    user_data = user_in.model_dump(exclude={"password", "role_ids"})
    user_data["tenant_id"] = current_user.get("tenant_id", "00000000-0000-0000-0000-000000000000")
    
    # Hash password if provided
    if user_in.password:
        from src.core.security import hash_password
        user_data["hashed_password"] = hash_password(user_in.password)
    
    # Create user
    user = await repo.create(user_data)
    
    return UserResponse.model_validate(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Get user by ID."""
    repo = UserRepository(db)
    user = await repo.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Check access (can only view users in same tenant unless super admin)
    is_super_admin = "super_admin" in current_user.get("roles", [])
    if not is_super_admin and user.tenant_id != current_user.get("tenant_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_admin),
) -> UserResponse:
    """Update user."""
    repo = UserRepository(db)
    user = await repo.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Check access
    is_super_admin = "super_admin" in current_user.get("roles", [])
    if not is_super_admin and user.tenant_id != current_user.get("tenant_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Update only provided fields
    update_data = user_in.model_dump(exclude_unset=True, exclude={"role_ids"})
    if update_data:
        user = await repo.update(user, update_data)
    
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_admin),
) -> None:
    """Delete user (soft delete - sets is_active to False)."""
    repo = UserRepository(db)
    user = await repo.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Check access
    is_super_admin = "super_admin" in current_user.get("roles", [])
    if not is_super_admin and user.tenant_id != current_user.get("tenant_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Can't delete yourself
    if user_id == current_user.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )
    
    # Soft delete
    await repo.update(user, {"is_active": False})

