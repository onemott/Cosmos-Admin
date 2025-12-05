"""Authentication endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest
from src.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate user and return tokens."""
    # TODO: Implement actual user lookup and verification
    # This is a placeholder implementation
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Login endpoint not yet implemented",
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Refresh access token using refresh token."""
    payload = decode_token(request.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # TODO: Verify refresh token type and user still exists
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Refresh endpoint not yet implemented",
    )


@router.post("/logout")
async def logout() -> dict:
    """Logout user (invalidate tokens)."""
    # TODO: Implement token blacklisting if needed
    return {"message": "Successfully logged out"}

