"""Client management endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.db.session import get_db
from src.db.repositories.client_repo import ClientRepository
from src.schemas.client import ClientCreate, ClientUpdate, ClientResponse, ClientSummaryResponse
from src.api.deps import get_current_user
from src.models.client import Client
from src.models.account import Account
from src.models.document import Document

router = APIRouter()


@router.get("/", response_model=List[ClientSummaryResponse])
async def list_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> List[ClientSummaryResponse]:
    """List clients. Super admins see all clients, others see only their tenant's clients."""
    repo = ClientRepository(db)
    
    is_super_admin = "super_admin" in current_user.get("roles", [])
    tenant_id = None if is_super_admin else current_user.get("tenant_id")
    
    if search:
        clients = await repo.search_clients(search, tenant_id=tenant_id, skip=skip, limit=limit)
    elif tenant_id:
        clients = await repo.get_clients_by_tenant(tenant_id, skip=skip, limit=limit)
    else:
        clients = await repo.get_all_clients(skip=skip, limit=limit)
    
    # Build summary responses with AUM
    result = []
    for client in clients:
        aum = await repo.get_client_aum(client.id)
        result.append(ClientSummaryResponse(
            id=client.id,
            display_name=client.display_name,
            client_type=client.client_type,
            kyc_status=client.kyc_status,
            total_aum=float(aum) if aum else None,
        ))
    
    return result


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_in: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ClientResponse:
    """Create a new client."""
    repo = ClientRepository(db)
    
    # Check if email already exists in tenant
    tenant_id = current_user.get("tenant_id", "00000000-0000-0000-0000-000000000000")
    if client_in.email:
        existing = await repo.get_by_email(client_in.email, tenant_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Client with email '{client_in.email}' already exists",
            )
    
    # Prepare client data
    client_data = client_in.model_dump()
    client_data["tenant_id"] = tenant_id
    
    # Create client
    client = await repo.create(client_data)
    
    return ClientResponse.model_validate(client)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ClientResponse:
    """Get client by ID."""
    repo = ClientRepository(db)
    client = await repo.get(client_id)
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    # Check access
    is_super_admin = "super_admin" in current_user.get("roles", [])
    if not is_super_admin and client.tenant_id != current_user.get("tenant_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return ClientResponse.model_validate(client)


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    client_in: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ClientResponse:
    """Update client."""
    repo = ClientRepository(db)
    client = await repo.get(client_id)
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    # Check access
    is_super_admin = "super_admin" in current_user.get("roles", [])
    if not is_super_admin and client.tenant_id != current_user.get("tenant_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Update only provided fields
    update_data = client_in.model_dump(exclude_unset=True)
    if update_data:
        client = await repo.update(client, update_data)
    
    return ClientResponse.model_validate(client)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> None:
    """Delete client (hard delete - be careful!)."""
    repo = ClientRepository(db)
    client = await repo.get(client_id)
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    # Check access
    is_super_admin = "super_admin" in current_user.get("roles", [])
    if not is_super_admin and client.tenant_id != current_user.get("tenant_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    await repo.delete(client)


@router.get("/{client_id}/accounts")
async def get_client_accounts(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> List[dict]:
    """Get all accounts for a client."""
    repo = ClientRepository(db)
    client = await repo.get_with_accounts(client_id)
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    # Check access
    is_super_admin = "super_admin" in current_user.get("roles", [])
    if not is_super_admin and client.tenant_id != current_user.get("tenant_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return [
        {
            "id": acc.id,
            "account_number": acc.account_number,
            "account_name": acc.account_name,
            "account_type": acc.account_type.value,
            "currency": acc.currency,
            "total_value": float(acc.total_value),
            "cash_balance": float(acc.cash_balance),
            "is_active": acc.is_active,
        }
        for acc in client.accounts
    ]


@router.get("/{client_id}/documents")
async def get_client_documents(
    client_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> List[dict]:
    """Get all documents for a client."""
    repo = ClientRepository(db)
    client = await repo.get(client_id)
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    # Check access
    is_super_admin = "super_admin" in current_user.get("roles", [])
    if not is_super_admin and client.tenant_id != current_user.get("tenant_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Get documents for client
    query = select(Document).where(Document.client_id == client_id)
    result = await db.execute(query)
    documents = result.scalars().all()
    
    return [
        {
            "id": doc.id,
            "name": doc.name,
            "document_type": doc.document_type.value if hasattr(doc.document_type, 'value') else doc.document_type,
            "file_path": doc.file_path,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
        }
        for doc in documents
    ]

