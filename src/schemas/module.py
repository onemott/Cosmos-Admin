"""Module schemas for request/response validation."""

from typing import Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class ModuleCategory(str, Enum):
    """Module category enumeration."""

    BASIC = "basic"
    INVESTMENT = "investment"
    ANALYTICS = "analytics"


class ModuleBase(BaseModel):
    """Base module schema."""

    code: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-z0-9_]+$")
    name: str = Field(..., min_length=2, max_length=255)
    name_zh: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    description_zh: Optional[str] = Field(None, max_length=1000)
    category: ModuleCategory = ModuleCategory.BASIC
    is_core: bool = False
    is_active: bool = True


class ModuleCreate(ModuleBase):
    """Module creation schema."""

    pass


class ModuleUpdate(BaseModel):
    """Module update schema."""

    name: Optional[str] = Field(None, min_length=2, max_length=255)
    name_zh: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    description_zh: Optional[str] = Field(None, max_length=1000)
    category: Optional[ModuleCategory] = None
    is_active: Optional[bool] = None
    # Note: code and is_core cannot be updated after creation


class ModuleResponse(BaseModel):
    """Module response schema."""

    id: str
    code: str
    name: str
    name_zh: Optional[str] = None
    description: Optional[str] = None
    description_zh: Optional[str] = None
    category: ModuleCategory
    version: str
    is_core: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class TenantModuleResponse(BaseModel):
    """Tenant module status response schema."""

    id: str
    code: str
    name: str
    name_zh: Optional[str] = None
    description: Optional[str] = None
    description_zh: Optional[str] = None
    category: ModuleCategory
    version: str
    is_core: bool
    is_active: bool  # Global active status
    is_enabled: bool  # Tenant-specific enabled status (True for core modules)
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class ModuleAccessRequest(BaseModel):
    """Request for module access from tenant admin."""

    module_code: str = Field(..., min_length=2, max_length=50)
    message: Optional[str] = Field(None, max_length=1000)


class ModuleAccessRequestResponse(BaseModel):
    """Response for module access request."""

    status: str = "pending"
    message: str = "Your request has been submitted and will be reviewed by platform administrators."


class ClientModuleResponse(BaseModel):
    """Client module status response schema."""

    id: str
    code: str
    name: str
    name_zh: Optional[str] = None
    description: Optional[str] = None
    description_zh: Optional[str] = None
    category: ModuleCategory
    version: str
    is_core: bool
    is_active: bool  # Global active status
    is_tenant_enabled: bool  # Whether tenant has access to this module
    is_client_enabled: bool  # Client-specific enabled status
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True

