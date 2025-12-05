"""User schemas."""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    first_name: str
    last_name: str


class UserCreate(UserBase):
    """User creation schema."""

    password: Optional[str] = None
    role_ids: Optional[List[str]] = None


class UserUpdate(BaseModel):
    """User update schema."""

    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None
    role_ids: Optional[List[str]] = None


class UserResponse(UserBase):
    """User response schema."""

    id: str
    tenant_id: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class UserWithRolesResponse(UserResponse):
    """User response with roles included."""

    roles: List[str]

