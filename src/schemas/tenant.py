"""Tenant schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class TenantBase(BaseModel):
    """Base tenant schema."""

    name: str
    slug: str
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class TenantCreate(TenantBase):
    """Tenant creation schema."""

    branding: Optional[dict] = None
    settings: Optional[dict] = None


class TenantUpdate(BaseModel):
    """Tenant update schema."""

    name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    branding: Optional[dict] = None
    settings: Optional[dict] = None
    is_active: Optional[bool] = None


class TenantResponse(TenantBase):
    """Tenant response schema."""

    id: str
    is_active: bool
    branding: Optional[dict] = None
    settings: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True

