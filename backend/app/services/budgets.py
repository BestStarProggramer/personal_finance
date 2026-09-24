from datetime import date
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Budget
from app.schemas.budgets import BudgetWrite
from app.services.categories import get_category


def get_budget(session: Session, budget_id: UUID, lock: bool = False) -> Budget:
    statement = select(Budget).where(Budget.id == budget_id)
    if lock:
        statement = statement.with_for_update()
    budget = session.scalar(statement)
    if budget is None:
        raise HTTPException(status_code=404, detail="Бюджет не найден.")
    return budget


def list_budgets(
    session: Session, category_id: UUID | None, month: date | None, limit: int, offset: int,
) -> list[Budget]:
    statement = select(Budget)
    if category_id is not None:
        statement = statement.where(Budget.category_id == category_id)
    if month is not None:
        statement = statement.where(Budget.month == month)
    return list(session.scalars(statement.order_by(Budget.month.desc(), Budget.id).limit(limit).offset(offset)))


def validate_budget(session: Session, data: BudgetWrite, budget_id: UUID | None = None) -> None:
    category = get_category(session, data.category_id, lock=True)
    if category.type != "expense":
        raise HTTPException(status_code=422, detail="Бюджет можно создать только для расходной категории.")
    statement = select(Budget.id).where(Budget.category_id == data.category_id, Budget.month == data.month)
    if budget_id is not None:
        statement = statement.where(Budget.id != budget_id)
    if session.scalar(statement) is not None:
        raise HTTPException(status_code=409, detail="Бюджет для этой категории и месяца уже существует.")


def create_budget(session: Session, data: BudgetWrite) -> Budget:
    validate_budget(session, data)
    budget = Budget(**data.model_dump())
    session.add(budget)
    session.commit()
    return budget


def update_budget(session: Session, budget_id: UUID, data: BudgetWrite) -> Budget:
    budget = get_budget(session, budget_id, lock=True)
    validate_budget(session, data, budget_id)
    for field, value in data.model_dump().items():
        setattr(budget, field, value)
    session.commit()
    return budget


def delete_budget(session: Session, budget_id: UUID) -> None:
    budget = get_budget(session, budget_id, lock=True)
    session.delete(budget)
    session.commit()
