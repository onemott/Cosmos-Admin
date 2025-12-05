"""Audit log model."""

from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import String, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class AuditLog(Base):
    """Immutable audit log for tracking sensitive actions."""

    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    tenant_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), nullable=False, index=True
    )

    # Event details
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)

    # Actor
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=True)
    user_email: Mapped[str] = mapped_column(String(255), nullable=True)

    # Request context
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str] = mapped_column(String(500), nullable=True)
    request_id: Mapped[str] = mapped_column(String(100), nullable=True)

    # Event data
    old_value: Mapped[dict] = mapped_column(JSON, nullable=True)
    new_value: Mapped[dict] = mapped_column(JSON, nullable=True)
    extra_data: Mapped[dict] = mapped_column(JSON, nullable=True)

    # Timestamp (immutable, no updated_at)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

