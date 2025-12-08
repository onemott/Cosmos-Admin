"""Role schemas."""

from datetime import datetime
from pydantic import BaseModel


class RoleBase(BaseModel):
    """Base role schema."""

    name: str
    description: str | None = None


class RoleResponse(RoleBase):
    """Role response schema."""

    id: str
    is_system: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True

