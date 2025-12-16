"""add tenant_products table and is_unlocked_for_all flag

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2025-12-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_unlocked_for_all column to products table
    op.add_column('products',
        sa.Column('is_unlocked_for_all', sa.Boolean(), nullable=False, server_default=sa.text('false'))
    )

    # Create tenant_products junction table
    op.create_table('tenant_products',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('tenant_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('product_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('is_visible', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id', 'product_id', name='uq_tenant_product')
    )
    op.create_index(op.f('ix_tenant_products_tenant_id'), 'tenant_products', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_tenant_products_product_id'), 'tenant_products', ['product_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_tenant_products_product_id'), table_name='tenant_products')
    op.drop_index(op.f('ix_tenant_products_tenant_id'), table_name='tenant_products')
    op.drop_table('tenant_products')

    op.drop_column('products', 'is_unlocked_for_all')
