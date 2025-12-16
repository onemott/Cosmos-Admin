"""Tenant model for multi-tenancy."""

from typing import TYPE_CHECKING, Optional
from uuid import uuid4

from sqlalchemy import String, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.user import User
    from src.models.client import Client
    from src.models.module import TenantModule
    from src.models.invitation import Invitation


class Tenant(Base, TimestampMixin):
    """EAM firm / tenant model."""

    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Branding and configuration
    branding: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Contact information
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="tenant")
    clients: Mapped[list["Client"]] = relationship("Client", back_populates="tenant")
    modules: Mapped[list["TenantModule"]] = relationship(
        "TenantModule", back_populates="tenant"
    )
    invitations: Mapped[list["Invitation"]] = relationship(
        "Invitation", back_populates="tenant"
    )

