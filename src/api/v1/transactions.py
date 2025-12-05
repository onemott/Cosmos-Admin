"""Transaction endpoints."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.api.deps import get_current_user

router = APIRouter()


@router.get("/")
async def list_transactions(
    client_id: str = None,
    account_id: str = None,
    transaction_type: str = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> List[dict]:
    """List transactions with optional filters."""
    # TODO: Implement transaction listing
    return []


@router.get("/{transaction_id}")
async def get_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Get transaction by ID."""
    # TODO: Implement transaction retrieval
    return {}

