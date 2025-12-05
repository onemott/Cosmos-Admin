"""Module and feature flag models."""

from typing import TYPE_CHECKING, Optional
from uuid import uuid4

from sqlalchemy import String, Boolean, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.tenant import Tenant


class Module(Base, TimestampMixin):
    """Allocation product / feature module model."""

    __tablename__ = "modules"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    # Module details
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0.0")

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_core: Mapped[bool] = mapped_column(Boolean, default=False)

    # Configuration schema
    config_schema: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    tenant_modules: Mapped[list["TenantModule"]] = relationship(
        "TenantModule", back_populates="module"
    )


class TenantModule(Base, TimestampMixin):
    """Tenant-module association with configuration."""

    __tablename__ = "tenant_modules"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    tenant_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("tenants.id"), nullable=False
    )
    module_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("modules.id"), nullable=False
    )

    # Status
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    # Configuration
    config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="modules")
    module: Mapped["Module"] = relationship("Module", back_populates="tenant_modules")

