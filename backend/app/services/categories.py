from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Budget, Category, Transaction
from app.schemas.categories import CategoryType, CategoryWrite


def get_category(session: Session, category_id: UUID, lock: bool = False) -> Category:
    statement = select(Category).where(Category.id == category_id)
    if lock:
        statement = statement.with_for_update()
    category = session.scalar(statement)
    if category is None:
        raise HTTPException(status_code=404, detail="Категория не найдена.")
    return category


def list_categories(session: Session, category_type: CategoryType | None, limit: int, offset: int) -> list[Category]:
    statement = select(Category)
    if category_type is not None:
        statement = statement.where(Category.type == category_type)
    return list(session.scalars(statement.order_by(Category.name, Category.id).limit(limit).offset(offset)))


def ensure_unique(session: Session, data: CategoryWrite, category_id: UUID | None = None) -> None:
    statement = select(Category.id).where(Category.name == data.name, Category.type == data.type)
    if category_id is not None:
        statement = statement.where(Category.id != category_id)
    if session.scalar(statement) is not None:
        raise HTTPException(status_code=409, detail="Категория с таким именем и типом уже существует.")


def has_records(session: Session, category_id: UUID) -> bool:
    return any(
        session.scalar(select(model.id).where(model.category_id == category_id).limit(1)) is not None
        for model in (Transaction, Budget)
    )


def create_category(session: Session, data: CategoryWrite) -> Category:
    ensure_unique(session, data)
    category = Category(**data.model_dump())
    session.add(category)
    session.commit()
    return category


def update_category(session: Session, category_id: UUID, data: CategoryWrite) -> Category:
    category = get_category(session, category_id, lock=True)
    if category.type != data.type and has_records(session, category_id):
        raise HTTPException(status_code=409, detail="Нельзя менять тип категории с операциями или бюджетами.")
    ensure_unique(session, data, category_id)
    category.name = data.name
    category.type = data.type
    session.commit()
    return category


def delete_category(session: Session, category_id: UUID) -> None:
    category = get_category(session, category_id, lock=True)
    if has_records(session, category_id):
        raise HTTPException(status_code=409, detail="Нельзя удалить категорию с операциями или бюджетами.")
    session.delete(category)
    session.commit()
