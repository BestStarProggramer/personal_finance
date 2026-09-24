from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.schemas.budgets import BudgetMonth, BudgetRead, BudgetWrite
from app.services import budgets


router = APIRouter(prefix="/budgets", tags=["Budgets"])
DatabaseSession = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[BudgetRead])
def list_budgets(
    session: DatabaseSession,
    category_id: UUID | None = None,
    month: Annotated[BudgetMonth | None, Query(description="Первое число месяца, например 2026-09-01")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    return budgets.list_budgets(session, category_id, month, limit, offset)


@router.get("/{budget_id}", response_model=BudgetRead)
def get_budget(budget_id: UUID, session: DatabaseSession):
    return budgets.get_budget(session, budget_id)


@router.post("", response_model=BudgetRead, status_code=201)
def create_budget(data: BudgetWrite, session: DatabaseSession):
    return budgets.create_budget(session, data)


@router.put("/{budget_id}", response_model=BudgetRead)
def update_budget(budget_id: UUID, data: BudgetWrite, session: DatabaseSession):
    return budgets.update_budget(session, budget_id, data)


@router.delete("/{budget_id}", status_code=204)
def delete_budget(budget_id: UUID, session: DatabaseSession) -> Response:
    budgets.delete_budget(session, budget_id)
    return Response(status_code=204)
