"""Authentication and security utilities."""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from src.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


class TokenPayload(BaseModel):
    """JWT token payload."""

    sub: str
    tenant_id: str
    roles: list[str]
    exp: datetime
    iat: datetime


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(
    subject: str,
    tenant_id: str,
    roles: list[str],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: dict[str, Any] = {
        "sub": subject,
        "tenant_id": tenant_id,
        "roles": roles,
        "exp": expire,
        "iat": now,
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def create_refresh_token(subject: str, tenant_id: str) -> str:
    """Create a JWT refresh token."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode: dict[str, Any] = {
        "sub": subject,
        "tenant_id": tenant_id,
        "type": "refresh",
        "exp": expire,
        "iat": now,
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[TokenPayload]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return TokenPayload(**payload)
    except JWTError:
        return None

