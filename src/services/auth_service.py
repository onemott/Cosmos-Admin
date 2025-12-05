"""Authentication service."""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models.user import User
from src.core.security import verify_password, hash_password, create_access_token, create_refresh_token


class AuthService:
    """Service for authentication operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate user by email and password."""
        result = await self.session.execute(
            select(User).where(User.email == email, User.is_active == True)
        )
        user = result.scalar_one_or_none()

        if not user or not user.hashed_password:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        return user

    async def create_tokens(self, user: User) -> dict:
        """Create access and refresh tokens for user."""
        roles = [role.name for role in user.roles]

        access_token = create_access_token(
            subject=str(user.id),
            tenant_id=str(user.tenant_id),
            roles=roles,
        )
        refresh_token = create_refresh_token(
            subject=str(user.id),
            tenant_id=str(user.tenant_id),
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 1800,  # 30 minutes
        }

    async def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> bool:
        """Change user password."""
        if not user.hashed_password:
            return False

        if not verify_password(current_password, user.hashed_password):
            return False

        user.hashed_password = hash_password(new_password)
        await self.session.flush()
        return True

