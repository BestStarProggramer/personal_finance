from datetime import date
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category, Transaction
from app.schemas.categories import CategoryType
from app.schemas.transactions import TransactionWrite
from app.services.categories import get_category


def get_transaction(session: Session, transaction_id: UUID, lock: bool = False) -> Transaction:
    statement = select(Transaction).where(Transaction.id == transaction_id)
    if lock:
        statement = statement.with_for_update()
    transaction = session.scalar(statement)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Операция не найдена.")
    return transaction


def list_transactions(
    session: Session, category_id: UUID | None, category_type: CategoryType | None,
    date_from: date | None, date_to: date | None, limit: int, offset: int,
) -> list[Transaction]:
    if date_from is not None and date_to is not None and date_from > date_to:
        raise HTTPException(status_code=422, detail="Начало периода не может быть позже его конца.")
    statement = select(Transaction).join(Category)
    if category_id is not None:
        statement = statement.where(Transaction.category_id == category_id)
    if category_type is not None:
        statement = statement.where(Category.type == category_type)
    if date_from is not None:
        statement = statement.where(Transaction.date >= date_from)
    if date_to is not None:
        statement = statement.where(Transaction.date <= date_to)
    return list(session.scalars(statement.order_by(Transaction.date.desc(), Transaction.id).limit(limit).offset(offset)))


def create_transaction(session: Session, data: TransactionWrite) -> Transaction:
    get_category(session, data.category_id, lock=True)
    transaction = Transaction(**data.model_dump())
    session.add(transaction)
    session.commit()
    return transaction


def update_transaction(session: Session, transaction_id: UUID, data: TransactionWrite) -> Transaction:
    transaction = get_transaction(session, transaction_id, lock=True)
    get_category(session, data.category_id, lock=True)
    for field, value in data.model_dump().items():
        setattr(transaction, field, value)
    session.commit()
    return transaction


def delete_transaction(session: Session, transaction_id: UUID) -> None:
    transaction = get_transaction(session, transaction_id, lock=True)
    session.delete(transaction)
    session.commit()
