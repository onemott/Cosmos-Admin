"""Fix existing products visibility - set is_unlocked_for_all=True for existing platform products.

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2024-12-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Set is_unlocked_for_all=True for all existing platform products.

    This preserves the old behavior where platform products (tenant_id=NULL, is_default=True)
    were automatically visible to all tenants.
    """
    # Update all existing platform products to be unlocked for all tenants
    op.execute("""
        UPDATE products
        SET is_unlocked_for_all = TRUE
        WHERE tenant_id IS NULL
          AND is_default = TRUE
          AND is_unlocked_for_all = FALSE
    """)


def downgrade() -> None:
    """Revert: set is_unlocked_for_all=False for platform products.

    Note: This will hide products from tenants unless TenantProduct records exist.
    """
    op.execute("""
        UPDATE products
        SET is_unlocked_for_all = FALSE
        WHERE tenant_id IS NULL
          AND is_default = TRUE
    """)
