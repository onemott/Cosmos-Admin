"""Common schemas used across the application."""

from typing import Generic, TypeVar, Optional, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Pagination parameters."""

    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""

    items: List[T]
    total: int
    skip: int
    limit: int
    has_more: bool


class ErrorResponse(BaseModel):
    """Error response schema."""

    detail: str
    code: Optional[str] = None
    errors: Optional[List[dict]] = None


class SuccessResponse(BaseModel):
    """Success response schema."""

    message: str
    data: Optional[dict] = None

