"""API dependencies for authentication and authorization."""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.config import settings
from src.core.security import decode_token, TokenPayload
from src.core.tenancy import set_current_tenant_id
from src.db.session import get_db
from src.models.tenant import Tenant

security = HTTPBearer(auto_error=False)


async def check_tenant_active(db: AsyncSession, tenant_id: str) -> bool:
    """Check if a tenant is active."""
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id)
    )
    tenant = result.scalar_one_or_none()
    return tenant is not None and tenant.is_active

# Development mode mock user for unauthenticated requests
# Using valid UUID format for database compatibility
DEV_MOCK_USER = {
    "user_id": "00000000-0000-0000-0000-000000000001",
    "tenant_id": "00000000-0000-0000-0000-000000000000",
    "roles": ["super_admin"],
    "email": "dev@eam-platform.local",
}


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get current authenticated user from JWT token.
    
    In development mode with no token, returns a mock super admin user.
    Also checks if the user's tenant is still active.
    """
    # Development mode bypass - allow unauthenticated access
    if settings.debug and (credentials is None or not credentials.credentials):
        return DEV_MOCK_USER
    
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        # In dev mode, allow invalid tokens too
        if settings.debug:
            return DEV_MOCK_USER
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user's tenant is still active
    if payload.tenant_id:
        if not await check_tenant_active(db, payload.tenant_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your organization's account has been deactivated. Please contact support.",
            )
        set_current_tenant_id(payload.tenant_id)

    return {
        "user_id": payload.sub,
        "tenant_id": payload.tenant_id,
        "roles": payload.roles or [],
    }


async def get_current_superuser(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Ensure current user is a platform admin (super_admin or platform_admin).
    
    Use for write operations (create/update/delete) on platform resources.
    """
    platform_roles = {"super_admin", "platform_admin"}
    user_roles = set(current_user.get("roles", []))
    
    if not platform_roles.intersection(user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform admin access required",
        )
    return current_user


async def get_platform_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Ensure current user has platform-level access (read-only or admin).
    
    Allowed roles:
    - super_admin, platform_admin: Full platform access
    - platform_user: Read-only platform access
    
    Use for read operations on platform resources like tenants list.
    """
    platform_roles = {"super_admin", "platform_admin", "platform_user"}
    user_roles = set(current_user.get("roles", []))
    
    if not platform_roles.intersection(user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform access required",
        )
    return current_user


async def get_current_tenant_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Ensure current user is a tenant admin or higher.
    
    Allowed roles:
    - super_admin, platform_admin: Platform-level access
    - tenant_admin: Tenant-level admin access
    """
    allowed_roles = {"super_admin", "platform_admin", "tenant_admin"}
    user_roles = set(current_user.get("roles", []))
    
    if not allowed_roles.intersection(user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """Get current user if authenticated, None otherwise.
    
    Useful for endpoints that work differently for authenticated vs anonymous users.
    """
    if credentials is None or not credentials.credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_permission(permission: str):
    """Dependency factory for permission checking."""

    async def check_permission(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        # TODO: Implement proper permission checking against database
        # For now, just return the user (permission check will be added later)
        return current_user

    return check_permission

