"""Authentication schemas."""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Login request schema."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response schema."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""

    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Change password request schema."""

    current_password: str
    new_password: str

