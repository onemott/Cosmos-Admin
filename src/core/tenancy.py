"""Multi-tenancy utilities and context management."""

from contextvars import ContextVar
from typing import Optional

from pydantic import BaseModel

# Context variable for current tenant
_current_tenant: ContextVar[Optional[str]] = ContextVar("current_tenant", default=None)


class TenantContext(BaseModel):
    """Tenant context information."""

    tenant_id: str
    tenant_name: Optional[str] = None


def get_current_tenant_id() -> Optional[str]:
    """Get the current tenant ID from context."""
    return _current_tenant.get()


def set_current_tenant_id(tenant_id: str) -> None:
    """Set the current tenant ID in context."""
    _current_tenant.set(tenant_id)


def clear_current_tenant() -> None:
    """Clear the current tenant from context."""
    _current_tenant.set(None)


class TenantScopedMixin:
    """Mixin for tenant-scoped models.

    Adds tenant_id field and ensures queries are scoped to tenant.
    """

    tenant_id: str

    @classmethod
    def tenant_filter(cls, tenant_id: str) -> dict:
        """Return filter dict for tenant scoping."""
        return {"tenant_id": tenant_id}

