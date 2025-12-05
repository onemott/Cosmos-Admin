# EAM Wealth Platform Backend - Setup Guide

## Quick Start

### Prerequisites

- Python 3.11 or higher
- PostgreSQL 15+ (or use Docker Compose)
- Redis (or use Docker Compose)

### Option 1: Docker Compose (Recommended for Testing)

This will start PostgreSQL, Redis, and the backend API:

```bash
cd backend
docker-compose -f docker/docker-compose.yml up
```

The API will be available at http://localhost:8000

### Option 2: Local Development

#### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure your database:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/eam_platform
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-change-this
```

#### 4. Start PostgreSQL and Redis

**Using Docker:**

```bash
# PostgreSQL
docker run -d \
  --name eam-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=eam_platform \
  -p 5432:5432 \
  postgres:15-alpine

# Redis
docker run -d \
  --name eam-redis \
  -p 6379:6379 \
  redis:7-alpine
```

**Or install locally:**
- PostgreSQL: https://www.postgresql.org/download/
- Redis: https://redis.io/download/

#### 5. Run Database Migrations

```bash
alembic upgrade head
```

#### 6. Start the API Server

```bash
uvicorn src.main:app --reload --port 8000
```

The API will be available at http://localhost:8000

#### 7. Start Celery Worker (Optional)

In a separate terminal:

```bash
source venv/bin/activate
celery -A src.workers.celery_app worker --loglevel=info
```

#### 8. Start Celery Beat (Optional)

For scheduled tasks, in another terminal:

```bash
source venv/bin/activate
celery -A src.workers.celery_app beat --loglevel=info
```

## Verify Installation

### Check API Health

```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status":"healthy","version":"0.1.0"}
```

### Check API Documentation

Open in browser:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Database Management

### Create a New Migration

After modifying models:

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply Migrations

```bash
alembic upgrade head
```

### Rollback Last Migration

```bash
alembic downgrade -1
```

### View Current Migration

```bash
alembic current
```

## Testing

### Run All Tests

```bash
pytest
```

### Run with Coverage

```bash
pytest --cov=src --cov-report=html
```

### Run Specific Test File

```bash
pytest tests/test_api.py
```

## Development Tools

### Code Formatting

```bash
black src/
```

### Linting

```bash
ruff check src/
```

### Type Checking

```bash
mypy src/
```

## Common Issues

### Port Already in Use

If port 8000 is already in use:

```bash
uvicorn src.main:app --reload --port 8001
```

### Database Connection Error

1. Verify PostgreSQL is running:
```bash
docker ps  # If using Docker
# or
pg_isready  # If installed locally
```

2. Check connection string in `.env`

3. Ensure database exists:
```bash
createdb eam_platform  # If using local PostgreSQL
```

### Redis Connection Error

1. Verify Redis is running:
```bash
docker ps  # If using Docker
# or
redis-cli ping  # Should return PONG
```

## Environment Variables Reference

```env
# Application
APP_ENV=development
DEBUG=true
SECRET_KEY=change-me-in-production
API_VERSION=v1

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/dbname
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://localhost:6379/0

# AWS (for production)
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=eam-platform-documents

# Auth (OIDC/OAuth2)
OIDC_ISSUER_URL=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_AUDIENCE=

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

## Next Steps

1. **Seed Initial Data** - Create test tenants and users
2. **Test API Endpoints** - Use Swagger UI or Postman
3. **Configure Authentication** - Set up Auth0/Cognito
4. **Start Admin Portal** - Connect frontend to backend

## Production Deployment

See separate `DEPLOYMENT.md` for production setup instructions.

