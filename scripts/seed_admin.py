#!/usr/bin/env python3
"""Seed script to create the platform tenant and admin user.

This creates:
1. Platform tenant (your company) - for platform operations AND your own CRM
2. Super admin user - can manage all tenants + access your company's CRM

Usage:
    cd backend
    source venv/bin/activate
    python scripts/seed_admin.py
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from src.db.session import async_session_factory
from src.models.user import User, Role
from src.models.tenant import Tenant
from src.core.security import hash_password


# ============================================
# PLATFORM TENANT CONFIGURATION
# This is YOUR COMPANY - the platform operator
# ============================================
PLATFORM_TENANT_ID = "00000000-0000-0000-0000-000000000000"
PLATFORM_TENANT_NAME = "Platform Operator"  # Change to your company name
PLATFORM_TENANT_SLUG = "platform"
PLATFORM_CONTACT_EMAIL = "admin@eam-platform.com"

# ============================================
# SUPER ADMIN CREDENTIALS
# CHANGE THESE IN PRODUCTION!
# ============================================
ADMIN_EMAIL = "admin@eam-platform.com"
ADMIN_PASSWORD = "admin123"
ADMIN_FIRST_NAME = "Admin"
ADMIN_LAST_NAME = "User"


async def seed_platform():
    """Create the platform tenant and super admin user."""
    async with async_session_factory() as session:
        try:
            # ============================================
            # Step 1: Create or update platform tenant
            # ============================================
            tenant = await session.get(Tenant, PLATFORM_TENANT_ID)
            if not tenant:
                print(f"📦 Creating platform tenant...")
                tenant = Tenant(
                    id=PLATFORM_TENANT_ID,
                    name=PLATFORM_TENANT_NAME,
                    slug=PLATFORM_TENANT_SLUG,
                    contact_email=PLATFORM_CONTACT_EMAIL,
                    is_active=True,
                    settings={
                        "is_platform_tenant": True,
                        "description": "Platform operator tenant - manages all EAM firms"
                    }
                )
                session.add(tenant)
                await session.flush()
                print(f"✅ Created platform tenant: {tenant.name}")
            else:
                print(f"✅ Platform tenant exists: {tenant.name}")
                # Update settings to mark as platform tenant
                if tenant.settings is None:
                    tenant.settings = {}
                tenant.settings["is_platform_tenant"] = True
                await session.flush()
            
            # ============================================
            # Step 2: Create or update super admin user
            # ============================================
            query = select(User).where(User.email == ADMIN_EMAIL)
            result = await session.execute(query)
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"⚠️  Admin user already exists: {ADMIN_EMAIL}")
                print(f"   Updating password and ensuring super admin status...")
                existing_user.hashed_password = hash_password(ADMIN_PASSWORD)
                existing_user.is_superuser = True
                existing_user.tenant_id = PLATFORM_TENANT_ID
                await session.flush()
                admin_user = existing_user
                print(f"✅ Admin user updated!")
            else:
                print(f"👤 Creating super admin user...")
                admin_user = User(
                    email=ADMIN_EMAIL,
                    hashed_password=hash_password(ADMIN_PASSWORD),
                    first_name=ADMIN_FIRST_NAME,
                    last_name=ADMIN_LAST_NAME,
                    tenant_id=PLATFORM_TENANT_ID,
                    is_active=True,
                    is_superuser=True,
                )
                session.add(admin_user)
                await session.flush()
                print(f"✅ Super admin created!")
            
            # ============================================
            # Step 3: Assign platform_admin role to admin
            # ============================================
            print(f"🔐 Assigning platform_admin role...")
            
            # Get the platform_admin role
            role_query = select(Role).where(Role.name == "platform_admin")
            role_result = await session.execute(role_query)
            platform_admin_role = role_result.scalar_one_or_none()
            
            if not platform_admin_role:
                print(f"⚠️  platform_admin role not found. Run seed_roles.py first!")
                await session.commit()
            else:
                # Check if role is already assigned using direct query (avoid lazy loading)
                from sqlalchemy import text
                check_query = text(
                    "SELECT 1 FROM user_roles WHERE user_id = :user_id AND role_id = :role_id"
                )
                check_result = await session.execute(
                    check_query, 
                    {"user_id": str(admin_user.id), "role_id": str(platform_admin_role.id)}
                )
                existing = check_result.scalar_one_or_none()
                
                if not existing:
                    # Insert directly into user_roles
                    insert_query = text(
                        "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)"
                    )
                    await session.execute(
                        insert_query,
                        {"user_id": str(admin_user.id), "role_id": str(platform_admin_role.id)}
                    )
                    await session.commit()
                    print(f"✅ Assigned platform_admin role to admin user!")
                else:
                    await session.commit()
                    print(f"✅ Admin user already has platform_admin role")
            
            # ============================================
            # Summary
            # ============================================
            print(f"")
            print(f"=" * 50)
            print(f"🎉 Platform Setup Complete!")
            print(f"=" * 50)
            print(f"")
            print(f"Platform Tenant:")
            print(f"  Name:  {PLATFORM_TENANT_NAME}")
            print(f"  Slug:  {PLATFORM_TENANT_SLUG}")
            print(f"  ID:    {PLATFORM_TENANT_ID}")
            print(f"")
            print(f"Super Admin:")
            print(f"  Email:    {ADMIN_EMAIL}")
            print(f"  Password: {ADMIN_PASSWORD}")
            print(f"")
            print(f"This user can:")
            print(f"  ✅ Manage all tenants (EAM firms)")
            print(f"  ✅ Manage users across all tenants")
            print(f"  ✅ View platform-wide statistics")
            print(f"  ✅ Manage clients within the platform tenant only")
            print(f"")
            print(f"⚠️  IMPORTANT: Change credentials before production!")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    print("🚀 Setting up EAM Platform...")
    print("")
    asyncio.run(seed_platform())

