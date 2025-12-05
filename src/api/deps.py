"""API dependencies for authentication and authorization."""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from src.core.security import decode_token, TokenPayload
from src.core.tenancy import set_current_tenant_id

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Get current authenticated user from JWT token."""
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Set tenant context
    set_current_tenant_id(payload.tenant_id)

    return {
        "user_id": payload.sub,
        "tenant_id": payload.tenant_id,
        "roles": payload.roles,
    }


async def get_current_superuser(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Ensure current user is a super admin."""
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
    allowed_roles = {"super_admin", "tenant_admin", "eam_manager"}
    if not allowed_roles.intersection(set(current_user.get("roles", []))):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_permission(permission: str):
    """Dependency factory for permission checking."""

    async def check_permission(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        # TODO: Implement proper permission checking against database
        # For now, just return the user
        return current_user

    return check_permission

