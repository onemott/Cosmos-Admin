#!/usr/bin/env python3
"""Seed script to create system roles.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/seed_roles.py
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from src.db.session import async_session_factory
from src.models.user import Role


# System roles definition
SYSTEM_ROLES = [
    {
        "name": "platform_admin",
        "description": "Platform super admin - full access to all platform features and tenant management",
        "is_system": True,
    },
    {
        "name": "platform_user",
        "description": "Platform user - can view platform information but has limited management access",
        "is_system": True,
    },
    {
        "name": "tenant_admin",
        "description": "Tenant admin - full access to manage users and clients within their tenant",
        "is_system": True,
    },
    {
        "name": "tenant_user",
        "description": "Tenant user - can work with clients but cannot manage users or settings",
        "is_system": True,
    },
]


async def seed_roles():
    """Create system roles."""
    async with async_session_factory() as session:
        try:
            created_count = 0
            updated_count = 0
            
            for role_data in SYSTEM_ROLES:
                # Check if role exists
                query = select(Role).where(Role.name == role_data["name"])
                result = await session.execute(query)
                existing_role = result.scalar_one_or_none()
                
                if existing_role:
                    # Update description if changed
                    if existing_role.description != role_data["description"]:
                        existing_role.description = role_data["description"]
                        existing_role.is_system = role_data["is_system"]
                        updated_count += 1
                        print(f"📝 Updated role: {role_data['name']}")
                    else:
                        print(f"✓  Role exists: {role_data['name']}")
                else:
                    # Create new role
                    role = Role(**role_data)
                    session.add(role)
                    created_count += 1
                    print(f"✅ Created role: {role_data['name']}")
            
            await session.commit()
            
            print(f"\n{'='*60}")
            print(f"🎉 Role Seeding Complete!")
            print(f"{'='*60}")
            print(f"Created: {created_count} roles")
            print(f"Updated: {updated_count} roles")
            print(f"Total: {len(SYSTEM_ROLES)} system roles")
            print(f"\n📋 Role Access Matrix:")
            print(f"{'='*60}")
            print(f"platform_admin  → Full platform access + tenant management")
            print(f"platform_user   → View platform info (read-only tenant list)")
            print(f"tenant_admin    → Manage users/clients in own tenant")
            print(f"tenant_user     → Work with clients (no user management)")
            print(f"{'='*60}\n")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    print("🚀 Seeding system roles...\n")
    asyncio.run(seed_roles())

