#!/usr/bin/env python3
"""Seed script to create system modules.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/seed_modules.py
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from src.db.session import async_session_factory
from src.models.module import Module, ModuleCategory


# Module definitions
# Basic modules (is_core=True): always-on, cannot be disabled
# Unlock-needed modules (is_core=False): require platform admin to enable per tenant

SYSTEM_MODULES = [
    # === BASIC MODULES (is_core=True) ===
    {
        "code": "core_platform",
        "name": "Core Platform",
        "name_zh": "核心平台",
        "description": "Multi-tenant setup, users, roles, permissions, and basic platform infrastructure",
        "description_zh": "多租户设置、用户管理、角色权限及基础平台架构",
        "category": ModuleCategory.BASIC,
        "is_core": True,
        "is_active": True,
    },
    {
        "code": "client_onboarding",
        "name": "Client Onboarding & KYC",
        "name_zh": "客户入驻与KYC",
        "description": "Digital onboarding flows, KYC forms, risk profiling, and compliance workflows",
        "description_zh": "数字化客户入驻流程、KYC表单、风险评估及合规工作流",
        "category": ModuleCategory.BASIC,
        "is_core": True,
        "is_active": True,
    },
    {
        "code": "portfolio_overview",
        "name": "Client Portfolio Overview & Analytics",
        "name_zh": "客户投资组合概览与分析",
        "description": "Asset allocation views, returns calculation, performance charts, and portfolio analytics",
        "description_zh": "资产配置视图、收益计算、绩效图表及投资组合分析",
        "category": ModuleCategory.BASIC,
        "is_core": True,
        "is_active": True,
    },
    {
        "code": "crm_communications",
        "name": "CRM Communications System",
        "name_zh": "CRM沟通系统",
        "description": "Client relationship management, secure messaging, notifications, and communication logs",
        "description_zh": "客户关系管理、安全消息传递、通知及沟通记录",
        "category": ModuleCategory.BASIC,
        "is_core": True,
        "is_active": True,
    },
    
    # === INVESTMENT MODULES (unlock-needed) ===
    {
        "code": "custom_portfolio",
        "name": "Custom Investment Portfolio",
        "name_zh": "私人定制建议投资组合",
        "description": "Customized investment portfolio recommendations tailored to individual client needs",
        "description_zh": "根据个人客户需求量身定制的投资组合建议",
        "category": ModuleCategory.INVESTMENT,
        "is_core": False,
        "is_active": True,
    },
    {
        "code": "private_banking",
        "name": "Private Banking Products",
        "name_zh": "私人银行产品",
        "description": "Exclusive private banking products and services for high-net-worth clients",
        "description_zh": "为高净值客户提供的专属私人银行产品与服务",
        "category": ModuleCategory.INVESTMENT,
        "is_core": False,
        "is_active": True,
    },
    {
        "code": "eam_products",
        "name": "EAM Investment Products",
        "name_zh": "EAM投资产品",
        "description": "External Asset Manager specific investment products and solutions",
        "description_zh": "外部资产管理公司专属投资产品与解决方案",
        "category": ModuleCategory.INVESTMENT,
        "is_core": False,
        "is_active": True,
    },
    {
        "code": "insurance_services",
        "name": "Insurance Services",
        "name_zh": "保险服务",
        "description": "Life insurance, wealth protection, and insurance-linked investment solutions",
        "description_zh": "人寿保险、财富保障及保险挂钩投资解决方案",
        "category": ModuleCategory.INVESTMENT,
        "is_core": False,
        "is_active": True,
    },
    {
        "code": "cd_solutions",
        "name": "CD Solutions",
        "name_zh": "CD解决方案",
        "description": "Certificate of Deposit products with competitive rates and flexible terms",
        "description_zh": "具有竞争力利率和灵活期限的定期存款产品",
        "category": ModuleCategory.INVESTMENT,
        "is_core": False,
        "is_active": True,
    },
    {
        "code": "quant_investing",
        "name": "Quantitative Investing",
        "name_zh": "量化投资",
        "description": "Quantitative investment strategies powered by algorithmic trading and data analysis",
        "description_zh": "基于算法交易和数据分析的量化投资策略",
        "category": ModuleCategory.INVESTMENT,
        "is_core": False,
        "is_active": True,
    },
    {
        "code": "alternative_investments",
        "name": "Alternative Investments",
        "name_zh": "另类投资",
        "description": "Access to alternative investment opportunities including PE, hedge funds, and real assets",
        "description_zh": "私募股权、对冲基金及实物资产等另类投资机会",
        "category": ModuleCategory.INVESTMENT,
        "is_core": False,
        "is_active": True,
    },
    
    # === ANALYTICS MODULES (unlock-needed) ===
    {
        "code": "expert_advice",
        "name": "Industry Expert Advice",
        "name_zh": "行业专家建议",
        "description": "Expert insights and recommendations from industry specialists",
        "description_zh": "来自行业专家的洞察与建议",
        "category": ModuleCategory.ANALYTICS,
        "is_core": False,
        "is_active": True,
    },
    {
        "code": "macro_analysis",
        "name": "Macro Analysis",
        "name_zh": "宏观分析",
        "description": "Macroeconomic analysis, market trends, and global economic outlook reports",
        "description_zh": "宏观经济分析、市场趋势及全球经济展望报告",
        "category": ModuleCategory.ANALYTICS,
        "is_core": False,
        "is_active": True,
    },
    {
        "code": "ai_recommendations",
        "name": "AI Recommendations",
        "name_zh": "AI建议",
        "description": "AI-powered investment recommendations and portfolio optimization suggestions",
        "description_zh": "AI驱动的投资建议与投资组合优化方案",
        "category": ModuleCategory.ANALYTICS,
        "is_core": False,
        "is_active": True,
    },
    {
        "code": "risk_assessment",
        "name": "Asset Risk Assessment",
        "name_zh": "资产风险评估",
        "description": "Comprehensive asset risk assessment, stress testing, and risk monitoring tools",
        "description_zh": "全面的资产风险评估、压力测试及风险监控工具",
        "category": ModuleCategory.ANALYTICS,
        "is_core": False,
        "is_active": True,
    },
]


async def seed_modules():
    """Create or update system modules."""
    async with async_session_factory() as session:
        try:
            created_count = 0
            updated_count = 0
            
            for module_data in SYSTEM_MODULES:
                # Check if module exists by code
                query = select(Module).where(Module.code == module_data["code"])
                result = await session.execute(query)
                existing_module = result.scalar_one_or_none()
                
                if existing_module:
                    # Update existing module (but preserve code and is_core for core modules)
                    changed = False
                    for key, value in module_data.items():
                        if key in ("code",):  # Don't update code
                            continue
                        if key == "is_core" and existing_module.is_core:
                            # Don't change is_core for already-core modules
                            continue
                        current_value = getattr(existing_module, key)
                        if current_value != value:
                            setattr(existing_module, key, value)
                            changed = True
                    
                    if changed:
                        updated_count += 1
                        print(f"📝 Updated module: {module_data['code']}")
                    else:
                        print(f"✓  Module exists: {module_data['code']}")
                else:
                    # Create new module
                    module = Module(**module_data)
                    session.add(module)
                    created_count += 1
                    print(f"✅ Created module: {module_data['code']}")
            
            await session.commit()
            
            # Summary
            basic_count = sum(1 for m in SYSTEM_MODULES if m["is_core"])
            unlock_count = len(SYSTEM_MODULES) - basic_count
            
            print(f"\n{'='*60}")
            print(f"🎉 Module Seeding Complete!")
            print(f"{'='*60}")
            print(f"Created: {created_count} modules")
            print(f"Updated: {updated_count} modules")
            print(f"Total: {len(SYSTEM_MODULES)} system modules")
            print(f"\n📋 Module Categories:")
            print(f"{'='*60}")
            print(f"Basic (always-on):     {basic_count} modules")
            print(f"Unlock-needed:         {unlock_count} modules")
            print(f"  - Investment:        {sum(1 for m in SYSTEM_MODULES if m['category'] == ModuleCategory.INVESTMENT)} modules")
            print(f"  - Analytics:         {sum(1 for m in SYSTEM_MODULES if m['category'] == ModuleCategory.ANALYTICS)} modules")
            print(f"{'='*60}\n")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    print("🚀 Seeding system modules...\n")
    asyncio.run(seed_modules())

