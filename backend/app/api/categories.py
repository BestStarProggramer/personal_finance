from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser
from app.db.session import get_session
from app.schemas.categories import CategoryRead, CategoryType, CategoryWrite
from app.services import categories


router = APIRouter(prefix="/categories", tags=["Categories"])
DatabaseSession = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[CategoryRead])
def list_categories(
    session: DatabaseSession,
    user: CurrentUser,
    type: CategoryType | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    return categories.list_categories(session, user.id, type, limit, offset)


@router.get("/{category_id}", response_model=CategoryRead)
def get_category(category_id: UUID, session: DatabaseSession, user: CurrentUser):
    return categories.get_category(session, category_id, user.id)


@router.post("", response_model=CategoryRead, status_code=201)
def create_category(data: CategoryWrite, session: DatabaseSession, user: CurrentUser):
    return categories.create_category(session, data, user.id)


@router.put("/{category_id}", response_model=CategoryRead)
def update_category(category_id: UUID, data: CategoryWrite, session: DatabaseSession, user: CurrentUser):
    return categories.update_category(session, category_id, data, user.id)


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: UUID, session: DatabaseSession, user: CurrentUser) -> Response:
    categories.delete_category(session, category_id, user.id)
    return Response(status_code=204)
