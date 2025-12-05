# EAM Wealth Platform – Backend (FastAPI)

This folder contains the FastAPI backend for the EAM Wealth Platform.

## Overview

A secure, scalable Python backend providing:
- RESTful APIs for mobile and web clients
- Multi-tenant architecture with strong isolation
- Bank API integrations (private banks, custodians)
- Background job processing for data sync and reports

## Tech Stack

- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.0 with async support
- **Database**: PostgreSQL (AWS RDS)
- **Cache**: Redis (AWS ElastiCache)
- **Task Queue**: Celery with Redis broker
- **Auth**: OIDC/OAuth2 (Auth0/Cognito integration)
- **Storage**: AWS S3 for documents
- **Secrets**: AWS Secrets Manager

## Project Structure (planned)

```
backend/
├── alembic/                    # Database migrations
│   ├── versions/
│   └── env.py
├── src/
│   ├── api/                    # API routes
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── tenants.py
│   │   │   ├── users.py
│   │   │   ├── clients.py
│   │   │   ├── accounts.py
│   │   │   ├── holdings.py
│   │   │   ├── transactions.py
│   │   │   ├── documents.py
│   │   │   ├── tasks.py
│   │   │   ├── modules.py
│   │   │   └── reports.py
│   │   └── deps.py             # Dependency injection
│   ├── core/                   # Core functionality
│   │   ├── config.py           # Settings and environment
│   │   ├── security.py         # Auth, JWT, permissions
│   │   ├── tenancy.py          # Multi-tenant logic
│   │   └── logging.py          # Structured logging
│   ├── db/                     # Database layer
│   │   ├── base.py             # SQLAlchemy base
│   │   ├── session.py          # Session management
│   │   └── repositories/       # Data access layer
│   ├── models/                 # SQLAlchemy models
│   │   ├── tenant.py
│   │   ├── user.py
│   │   ├── client.py
│   │   ├── account.py
│   │   ├── holding.py
│   │   ├── transaction.py
│   │   ├── document.py
│   │   ├── task.py
│   │   ├── module.py
│   │   └── audit_log.py
│   ├── schemas/                # Pydantic schemas
│   │   ├── tenant.py
│   │   ├── user.py
│   │   ├── client.py
│   │   └── ...
│   ├── services/               # Business logic
│   │   ├── auth_service.py
│   │   ├── client_service.py
│   │   ├── portfolio_service.py
│   │   └── report_service.py
│   ├── integrations/           # External integrations
│   │   ├── base.py             # Abstract connector interface
│   │   ├── bank_a/             # Bank A implementation
│   │   ├── bank_b/             # Bank B implementation
│   │   └── normalizer.py       # Data normalization
│   ├── workers/                # Celery tasks
│   │   ├── celery_app.py
│   │   ├── sync_tasks.py       # Bank data sync
│   │   ├── report_tasks.py     # Report generation
│   │   └── notification_tasks.py
│   └── main.py                 # FastAPI app entry point
├── tests/                      # Test suite
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── scripts/                    # Utility scripts
├── docker/                     # Docker configuration
│   ├── Dockerfile
│   └── docker-compose.yml
├── alembic.ini
├── pyproject.toml              # Poetry/pip config
├── requirements.txt
└── .env.example
```

## Getting Started

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start development server
uvicorn src.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A src.workers.celery_app worker --loglevel=info
```

## API Design

### Versioning
All APIs are versioned: `/api/v1/...`

### Key Endpoint Groups
- `/api/v1/auth/*` - Authentication, tokens, MFA
- `/api/v1/tenants/*` - Tenant management (super admin)
- `/api/v1/users/*` - User management
- `/api/v1/clients/*` - Client profiles, KYC
- `/api/v1/accounts/*` - Investment accounts
- `/api/v1/holdings/*` - Portfolio positions
- `/api/v1/transactions/*` - Trades, movements
- `/api/v1/documents/*` - Document management
- `/api/v1/tasks/*` - Workflows, approvals
- `/api/v1/modules/*` - Feature modules
- `/api/v1/reports/*` - Report generation

### Multi-Tenancy
- Tenant context derived from JWT claims
- All queries scoped by `tenant_id`
- Row-level security in PostgreSQL

## Security Considerations

- OAuth2/OIDC token validation
- Role-based access control (RBAC)
- Tenant isolation at data layer
- Input validation with Pydantic
- SQL injection prevention via ORM
- Rate limiting per tenant/user
- Audit logging for sensitive operations
- Secrets in AWS Secrets Manager (never in code)

## Bank Integration Security

- Connector isolation in dedicated modules
- Credentials from Secrets Manager only
- Mutual TLS where supported
- Circuit breaker patterns
- Idempotent data ingestion

