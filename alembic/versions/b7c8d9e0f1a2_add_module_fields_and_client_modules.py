"""Add module fields and client_modules table

Revision ID: b7c8d9e0f1a2
Revises: aa885811ca9c
Create Date: 2025-12-09 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, None] = 'aa885811ca9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ModuleCategory enum type
    module_category_enum = sa.Enum('BASIC', 'INVESTMENT', 'ANALYTICS', name='modulecategory')
    module_category_enum.create(op.get_bind(), checkfirst=True)
    
    # Add new columns to modules table
    op.add_column('modules', sa.Column('name_zh', sa.String(length=255), nullable=True))
    op.add_column('modules', sa.Column('description_zh', sa.String(length=1000), nullable=True))
    op.add_column('modules', sa.Column('category', module_category_enum, nullable=True))
    
    # Set default category for existing rows
    op.execute("UPDATE modules SET category = 'BASIC' WHERE category IS NULL")
    
    # Make category not nullable after setting defaults
    op.alter_column('modules', 'category', nullable=False)
    
    # Create client_modules table
    op.create_table('client_modules',
        sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('tenant_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('client_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('module_id', sa.UUID(as_uuid=False), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, default=True),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('client_id', 'module_id', name='uq_client_module')
    )
    op.create_index(op.f('ix_client_modules_tenant_id'), 'client_modules', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_client_modules_client_id'), 'client_modules', ['client_id'], unique=False)
    
    # Update tenant_modules foreign keys to have CASCADE delete
    # First drop existing foreign keys
    op.drop_constraint('tenant_modules_tenant_id_fkey', 'tenant_modules', type_='foreignkey')
    op.drop_constraint('tenant_modules_module_id_fkey', 'tenant_modules', type_='foreignkey')
    
    # Re-create with CASCADE
    op.create_foreign_key(
        'tenant_modules_tenant_id_fkey', 
        'tenant_modules', 'tenants', 
        ['tenant_id'], ['id'], 
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'tenant_modules_module_id_fkey', 
        'tenant_modules', 'modules', 
        ['module_id'], ['id'], 
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Drop client_modules table and indexes
    op.drop_index(op.f('ix_client_modules_client_id'), table_name='client_modules')
    op.drop_index(op.f('ix_client_modules_tenant_id'), table_name='client_modules')
    op.drop_table('client_modules')
    
    # Remove new columns from modules table
    op.drop_column('modules', 'category')
    op.drop_column('modules', 'description_zh')
    op.drop_column('modules', 'name_zh')
    
    # Drop enum type
    sa.Enum(name='modulecategory').drop(op.get_bind(), checkfirst=True)
    
    # Restore original foreign keys (without CASCADE)
    op.drop_constraint('tenant_modules_tenant_id_fkey', 'tenant_modules', type_='foreignkey')
    op.drop_constraint('tenant_modules_module_id_fkey', 'tenant_modules', type_='foreignkey')
    op.create_foreign_key(
        'tenant_modules_tenant_id_fkey', 
        'tenant_modules', 'tenants', 
        ['tenant_id'], ['id']
    )
    op.create_foreign_key(
        'tenant_modules_module_id_fkey', 
        'tenant_modules', 'modules', 
        ['module_id'], ['id']
    )

