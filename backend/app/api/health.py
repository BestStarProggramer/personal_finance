from fastapi import APIRouter

from app.schemas.health import HealthResponse


router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Проверка запуска API")
def health() -> HealthResponse:
    return HealthResponse()
