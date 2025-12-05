"""Document model."""

from typing import TYPE_CHECKING, Optional
from uuid import uuid4

from sqlalchemy import String, ForeignKey, Integer, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from src.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.client import Client


class DocumentType(str, enum.Enum):
    """Document type enumeration."""

    KYC = "kyc"
    STATEMENT = "statement"
    REPORT = "report"
    CONTRACT = "contract"
    TAX = "tax"
    COMPLIANCE = "compliance"
    OTHER = "other"


class DocumentStatus(str, enum.Enum):
    """Document status enumeration."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class Document(Base, TimestampMixin):
    """Document model for file storage."""

    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    tenant_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), nullable=False, index=True
    )
    client_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("clients.id"), nullable=True
    )

    # Document details
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[DocumentType] = mapped_column(
        SQLEnum(DocumentType), default=DocumentType.OTHER
    )
    status: Mapped[DocumentStatus] = mapped_column(
        SQLEnum(DocumentStatus), default=DocumentStatus.PENDING
    )
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # File details
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # S3 storage
    s3_bucket: Mapped[str] = mapped_column(String(255), nullable=False)
    s3_key: Mapped[str] = mapped_column(String(1000), nullable=False)

    # Uploaded by
    uploaded_by_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id"), nullable=True
    )

    # Relationships
    client: Mapped[Optional["Client"]] = relationship(
        "Client", back_populates="documents"
    )

