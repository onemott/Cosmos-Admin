"""Base connector interface for bank integrations."""

from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import date
from pydantic import BaseModel


class AccountData(BaseModel):
    """Normalized account data from bank."""
    external_id: str
    account_number: str
    account_name: str
    account_type: str
    currency: str
    total_value: float
    cash_balance: float


class HoldingData(BaseModel):
    """Normalized holding data from bank."""
    external_id: str
    account_external_id: str
    isin: Optional[str] = None
    name: str
    quantity: float
    market_value: float
    currency: str
    asset_class: Optional[str] = None


class TransactionData(BaseModel):
    """Normalized transaction data from bank."""
    external_id: str
    account_external_id: str
    transaction_type: str
    trade_date: date
    settlement_date: Optional[date] = None
    instrument_name: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    gross_amount: float
    net_amount: float
    currency: str


class BaseBankConnector(ABC):
    """Abstract base class for bank API connectors."""

    @property
    @abstractmethod
    def bank_code(self) -> str:
        """Unique identifier for this bank."""
        pass

    @property
    @abstractmethod
    def bank_name(self) -> str:
        """Human-readable bank name."""
        pass

    @abstractmethod
    async def authenticate(self, credentials: dict) -> bool:
        """Authenticate with the bank API."""
        pass

    @abstractmethod
    async def fetch_accounts(self) -> List[AccountData]:
        """Fetch all accounts from the bank."""
        pass

    @abstractmethod
    async def fetch_holdings(self, account_id: str) -> List[HoldingData]:
        """Fetch holdings for a specific account."""
        pass

    @abstractmethod
    async def fetch_transactions(
        self,
        account_id: str,
        start_date: date,
        end_date: date,
    ) -> List[TransactionData]:
        """Fetch transactions for a specific account and date range."""
        pass

    async def test_connection(self) -> bool:
        """Test if the connection to the bank is working."""
        try:
            await self.fetch_accounts()
            return True
        except Exception:
            return False

