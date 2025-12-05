"""Account management endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.api.deps import get_current_user

router = APIRouter()


@router.get("/")
async def list_accounts(
    client_id: str = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> List[dict]:
    """List accounts, optionally filtered by client."""
    # TODO: Implement account listing
    return []


@router.get("/{account_id}")
async def get_account(
    account_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Get account by ID."""
    # TODO: Implement account retrieval
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Account not found",
    )


@router.get("/{account_id}/holdings")
async def get_account_holdings(
    account_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> List[dict]:
    """Get holdings for an account."""
    # TODO: Implement holdings listing for account
    return []


@router.get("/{account_id}/transactions")
async def get_account_transactions(
    account_id: str,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> List[dict]:
    """Get transactions for an account."""
    # TODO: Implement transactions listing for account
    return []


@router.get("/{account_id}/performance")
async def get_account_performance(
    account_id: str,
    period: str = "1Y",  # 1M, 3M, 6M, 1Y, YTD, ALL
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Get performance metrics for an account."""
    # TODO: Implement performance calculation
    return {
        "account_id": account_id,
        "period": period,
        "return_percentage": 0.0,
        "return_amount": 0.0,
    }

