"""User management endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.db.repositories.user_repo import UserRepository
from src.schemas.user import UserCreate, UserUpdate, UserResponse
from src.api.deps import (
    get_current_user,
    get_current_tenant_admin,
    get_current_superuser,
)
from src.core.config import settings

router = APIRouter()


class PasswordChangeRequest(BaseModel):
    """Password change request schema."""

    current_password: Optional[str] = None
    new_password: str


def user_to_response(user) -> UserResponse:
    """Convert User model to UserResponse, handling roles properly."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        tenant_id=str(user.tenant_id),
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        roles=[role.name for role in user.roles] if user.roles else [],
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Get current user information."""
    repo = UserRepository(db)

    # In dev mode, return mock user data
    if (
        settings.debug
        and current_user.get("user_id") == "00000000-0000-0000-0000-000000000001"
    ):
        return UserResponse(
            id="00000000-0000-0000-0000-000000000001",
            email="dev@eam-platform.dev",
            first_name="Dev",
            last_name="User",
            tenant_id="00000000-0000-0000-0000-000000000000",
            is_active=True,
            is_superuser=True,
            roles=["super_admin"],
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
        )

    user = await repo.get_with_roles(current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user_to_response(user)


def is_platform_admin(user: dict) -> bool:
    """Check if user has platform-level admin access (can see all tenants).

    Only users with explicit platform roles can access cross-tenant data.
    - super_admin: Legacy role for backward compatibility
    - platform_admin: Standard platform administrator role
    """
    roles = set(user.get("roles", []))
    platform_roles = {"super_admin", "platform_admin"}
    return bool(platform_roles.intersection(roles))


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> List[UserResponse]:
    """List users.

    - Platform admins: See all users across all tenants
    - Tenant admins/users: See only users in their own tenant
    """
    repo = UserRepository(db)

    # Only platform-level admins can see all tenants
    # Tenant admins can only see their own tenant
    tenant_id = (
        None if is_platform_admin(current_user) else current_user.get("tenant_id")
    )

    if search:
        users = await repo.search_users(
            search, tenant_id=tenant_id, skip=skip, limit=limit
        )
    elif tenant_id:
        users = await repo.get_users_by_tenant(tenant_id, skip=skip, limit=limit)
    else:
        users = await repo.get_all_users(skip=skip, limit=limit)

    # Load roles for all users and convert to response
    result = []
    for user in users:
        user_with_roles = await repo.get_with_roles(user.id)
        result.append(user_to_response(user_with_roles))

    return result


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_admin),
) -> UserResponse:
    """Create a new user.

    - Regular users: Creates user in their own tenant
    - Super admins: Can specify tenant_id to create user in any tenant
    - Can assign roles via role_ids
    """
    repo = UserRepository(db)

    # Check if email already exists
    existing = await repo.get_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{user_in.email}' already exists",
        )

    # Prepare user data
    user_data = user_in.model_dump(exclude={"password", "role_ids", "tenant_id"})

    # Determine tenant_id
    if is_platform_admin(current_user) and user_in.tenant_id:
        # Super admin can specify tenant
        user_data["tenant_id"] = user_in.tenant_id
    else:
        # Use current user's tenant
        user_data["tenant_id"] = current_user.get(
            "tenant_id", "00000000-0000-0000-0000-000000000000"
        )

    # Hash password if provided
    if user_in.password:
        from src.core.security import hash_password

        user_data["hashed_password"] = hash_password(user_in.password)

    # Create user
    user = await repo.create(user_data)
    await db.commit()  # Ensure user is committed before assigning roles
    await db.refresh(user)

    # Assign roles if provided
    if user_in.role_ids:
        # Validate role assignments based on user's permission level
        if not is_platform_admin(current_user):
            # Non-platform admins can only assign tenant-level roles
            from sqlalchemy import select
            from src.models.user import Role

            role_query = select(Role).where(Role.id.in_(user_in.role_ids))
            role_result = await db.execute(role_query)
            roles_to_assign = role_result.scalars().all()

            platform_role_names = {"super_admin", "platform_admin", "platform_user"}
            for role in roles_to_assign:
                if role.name in platform_role_names:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Cannot assign platform role '{role.name}'. Only platform admins can assign platform-level roles.",
                    )

        user = await repo.assign_roles(user.id, user_in.role_ids)
    else:
        # Load roles anyway to return consistent response
        user = await repo.get_with_roles(user.id)

    return user_to_response(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    """Get user by ID with roles."""
    repo = UserRepository(db)
    user = await repo.get_with_roles(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check access (can only view users in same tenant unless platform admin)
    if not is_platform_admin(current_user) and str(user.tenant_id) != current_user.get(
        "tenant_id"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return user_to_response(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_admin),
) -> UserResponse:
    """Update user and optionally update roles."""
    repo = UserRepository(db)
    user = await repo.get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check access - only platform admins can update users in other tenants
    if not is_platform_admin(current_user) and str(user.tenant_id) != current_user.get(
        "tenant_id"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    # Update only provided fields
    update_data = user_in.model_dump(exclude_unset=True, exclude={"role_ids"})
    if update_data:
        user = await repo.update(user, update_data)
        await db.flush()  # Flush but don't commit yet

    # Update roles if provided
    if user_in.role_ids is not None:
        # Validate role assignments based on user's permission level
        if not is_platform_admin(current_user):
            # Non-platform admins can only assign tenant-level roles
            from sqlalchemy import select
            from src.models.user import Role

            role_query = select(Role).where(Role.id.in_(user_in.role_ids))
            role_result = await db.execute(role_query)
            roles_to_assign = role_result.scalars().all()

            platform_role_names = {"super_admin", "platform_admin", "platform_user"}
            for role in roles_to_assign:
                if role.name in platform_role_names:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Cannot assign platform role '{role.name}'. Only platform admins can assign platform-level roles.",
                    )

        user = await repo.assign_roles(str(user.id), user_in.role_ids)
    else:
        # Load roles anyway to return consistent response
        await db.commit()  # Commit the update
        user = await repo.get_with_roles(str(user.id))

    return user_to_response(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_admin),
) -> None:
    """Deactivate user (soft delete - sets is_active to False)."""
    repo = UserRepository(db)
    user = await repo.get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check access
    if not is_platform_admin(current_user) and str(user.tenant_id) != current_user.get(
        "tenant_id"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    # Can't delete yourself
    if user_id == current_user.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    # Soft delete
    await repo.update(user, {"is_active": False})


@router.delete("/{user_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_permanent(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_admin),
) -> None:
    """Permanently delete user.

    WARNING: This action cannot be undone.
    """
    repo = UserRepository(db)
    user = await repo.get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check access
    if not is_platform_admin(current_user) and str(user.tenant_id) != current_user.get(
        "tenant_id"
    ):
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

    # Can't delete super admins (safety measure)
    if user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot permanently delete super admin accounts",
        )

    # Hard delete
    await repo.delete(user)


@router.post("/{user_id}/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    user_id: str,
    request: PasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Change user password.

    - Users can change their own password (requires current_password)
    - Super admins can reset any user's password (no current_password required)
    - Tenant admins can reset passwords for users in their tenant
    """
    from src.core.security import hash_password, verify_password

    repo = UserRepository(db)
    user = await repo.get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    is_self = user_id == current_user.get("user_id")
    is_same_tenant = str(user.tenant_id) == current_user.get("tenant_id")
    has_platform_access = is_platform_admin(current_user)

    # Access control - platform admins can change any password, others only within their tenant
    if not has_platform_access and not is_self and not is_same_tenant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    # If changing own password (and not a platform admin), verify current password
    if is_self and not has_platform_access:
        if not request.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required",
            )
        if not verify_password(request.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

    # Update password
    new_hash = hash_password(request.new_password)
    await repo.update(user, {"hashed_password": new_hash})

    return {"message": "Password changed successfully"}
