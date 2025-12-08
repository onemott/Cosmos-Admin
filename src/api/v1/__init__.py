"""API v1 router."""

from fastapi import APIRouter

from src.api.v1 import auth, tenants, users, clients, accounts, holdings, transactions
from src.api.v1 import documents, tasks, modules, reports, stats, roles

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(roles.router, prefix="/roles", tags=["Roles"])
router.include_router(clients.router, prefix="/clients", tags=["Clients"])
router.include_router(accounts.router, prefix="/accounts", tags=["Accounts"])
router.include_router(holdings.router, prefix="/holdings", tags=["Holdings"])
router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
router.include_router(documents.router, prefix="/documents", tags=["Documents"])
router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
router.include_router(modules.router, prefix="/modules", tags=["Modules"])
router.include_router(reports.router, prefix="/reports", tags=["Reports"])
router.include_router(stats.router, prefix="/stats", tags=["Statistics"])

