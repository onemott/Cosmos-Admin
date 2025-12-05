"""Client schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

from src.models.client import ClientType, KYCStatus, RiskProfile


class ClientBase(BaseModel):
    """Base client schema."""

    client_type: ClientType = ClientType.INDIVIDUAL
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    entity_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class ClientCreate(ClientBase):
    """Client creation schema."""

    group_id: Optional[str] = None
    risk_profile: Optional[RiskProfile] = None
    extra_data: Optional[dict] = None


class ClientUpdate(BaseModel):
    """Client update schema."""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    entity_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    group_id: Optional[str] = None
    risk_profile: Optional[RiskProfile] = None
    kyc_status: Optional[KYCStatus] = None
    extra_data: Optional[dict] = None


class ClientResponse(ClientBase):
    """Client response schema."""

    id: str
    tenant_id: str
    group_id: Optional[str] = None
    kyc_status: KYCStatus
    risk_profile: Optional[RiskProfile] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class ClientSummaryResponse(BaseModel):
    """Client summary response for lists."""

    id: str
    display_name: str
    client_type: ClientType
    kyc_status: KYCStatus
    total_aum: Optional[float] = None

