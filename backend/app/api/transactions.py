from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.schemas.categories import CategoryType
from app.schemas.transactions import TransactionRead, TransactionWrite
from app.services import transactions


router = APIRouter(prefix="/transactions", tags=["Transactions"])
DatabaseSession = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[TransactionRead])
def list_transactions(
    session: DatabaseSession,
    category_id: UUID | None = None,
    type: CategoryType | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    return transactions.list_transactions(session, category_id, type, date_from, date_to, limit, offset)


@router.get("/{transaction_id}", response_model=TransactionRead)
def get_transaction(transaction_id: UUID, session: DatabaseSession):
    return transactions.get_transaction(session, transaction_id)


@router.post("", response_model=TransactionRead, status_code=201)
def create_transaction(data: TransactionWrite, session: DatabaseSession):
    return transactions.create_transaction(session, data)


@router.put("/{transaction_id}", response_model=TransactionRead)
def update_transaction(transaction_id: UUID, data: TransactionWrite, session: DatabaseSession):
    return transactions.update_transaction(session, transaction_id, data)


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: UUID, session: DatabaseSession) -> Response:
    transactions.delete_transaction(session, transaction_id)
    return Response(status_code=204)
