"""Authentication endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db.session import get_db
from src.db.repositories.user_repo import UserRepository
from src.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest
from src.models.user import User
from src.models.tenant import Tenant
from src.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter()


async def check_tenant_active(db: AsyncSession, tenant_id: str) -> bool:
    """Check if a tenant is active."""
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id)
    )
    tenant = result.scalar_one_or_none()
    return tenant is not None and tenant.is_active


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate user and return tokens."""
    repo = UserRepository(db)
    
    # Look up user by email with roles loaded
    user = await repo.get_by_email_for_auth(request.email)
    
    # Check if user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled",
        )
    
    # Check if user's tenant is active
    if not await check_tenant_active(db, str(user.tenant_id)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your organization's account has been deactivated. Please contact support.",
        )
    
    # Verify password
    if not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Load roles from database (explicit role assignment required)
    roles = [role.name for role in user.roles]
    
    # Generate tokens
    access_token = create_access_token(
        subject=str(user.id),
        tenant_id=str(user.tenant_id),
        roles=roles,
    )
    refresh_token = create_refresh_token(
        subject=str(user.id),
        tenant_id=str(user.tenant_id),
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Refresh access token using refresh token."""
    repo = UserRepository(db)
    
    payload = decode_token(request.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Verify user still exists and is active, load with roles
    user = await repo.get_with_roles(payload.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled",
        )
    
    # Check if user's tenant is active
    if not await check_tenant_active(db, str(user.tenant_id)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your organization's account has been deactivated. Please contact support.",
        )
    
    # Load roles from database (explicit role assignment required)
    roles = [role.name for role in user.roles]
    
    # Generate new tokens
    access_token = create_access_token(
        subject=str(user.id),
        tenant_id=str(user.tenant_id),
        roles=roles,
    )
    new_refresh_token = create_refresh_token(
        subject=str(user.id),
        tenant_id=str(user.tenant_id),
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout")
async def logout() -> dict:
    """Logout user (invalidate tokens).
    
    Note: With stateless JWT tokens, logout is handled client-side by
    removing the tokens. For enhanced security, implement token blacklisting
    using Redis in production.
    """
    return {"message": "Successfully logged out"}

