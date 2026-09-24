from fastapi import FastAPI
from sqlalchemy.exc import IntegrityError, OperationalError

from app.api.budgets import router as budgets_router
from app.api.categories import router as categories_router
from app.api.errors import database_error_handler, integrity_error_handler
from app.api.health import router as health_router
from app.api.transactions import router as transactions_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        debug=settings.debug,
    )
    application.include_router(health_router, prefix="/api")
    application.include_router(categories_router, prefix="/api")
    application.include_router(transactions_router, prefix="/api")
    application.include_router(budgets_router, prefix="/api")
    application.add_exception_handler(IntegrityError, integrity_error_handler)
    application.add_exception_handler(OperationalError, database_error_handler)
    return application


app = create_app()
