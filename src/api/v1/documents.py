"""Document management endpoints."""

from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.api.deps import get_current_user

router = APIRouter()


@router.get("/")
async def list_documents(
    client_id: str = None,
    document_type: str = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> List[dict]:
    """List documents with optional filters."""
    return []


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    client_id: str = None,
    document_type: str = "other",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Upload a new document."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Document upload not yet implemented",
    )


@router.get("/{document_id}")
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Get document metadata by ID."""
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Get presigned URL for document download."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Document download not yet implemented",
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> None:
    """Delete a document."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Document deletion not yet implemented",
    )

