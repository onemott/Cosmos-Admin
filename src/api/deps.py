"""API dependencies for authentication and authorization."""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from src.core.config import settings
from src.core.security import decode_token, TokenPayload
from src.core.tenancy import set_current_tenant_id

security = HTTPBearer(auto_error=False)

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
) -> dict:
    """Get current authenticated user from JWT token.
    
    In development mode with no token, returns a mock super admin user.
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

    # Set tenant context
    if payload.tenant_id:
        set_current_tenant_id(payload.tenant_id)

    return {
        "user_id": payload.sub,
        "tenant_id": payload.tenant_id,
        "roles": payload.roles or [],
    }


async def get_current_superuser(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Ensure current user is a super admin."""
    # In development mode, always allow
    if settings.debug:
        return current_user
    
    if "super_admin" not in current_user.get("roles", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required",
        )
    return current_user


async def get_current_tenant_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Ensure current user is a tenant admin or higher."""
    # In development mode, always allow
    if settings.debug:
        return current_user
    
    allowed_roles = {"super_admin", "tenant_admin", "eam_manager"}
    if not allowed_roles.intersection(set(current_user.get("roles", []))):
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
        # In development mode, always allow
        if settings.debug:
            return current_user
        # TODO: Implement proper permission checking against database
        # For now, just return the user
        return current_user

    return check_permission

