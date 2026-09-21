from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import get_session

from app.schemas.health import HealthResponse


router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Проверка запуска API")
def health() -> HealthResponse:
    return HealthResponse()


@router.get("/health/db", response_model=HealthResponse, summary="Проверка подключения к PostgreSQL")
def database_health(session: Annotated[Session, Depends(get_session)]) -> HealthResponse:
    try:
        session.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="База данных недоступна.") from None
    return HealthResponse()
