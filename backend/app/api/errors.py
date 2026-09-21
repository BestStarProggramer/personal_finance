from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError


def integrity_error_handler(request: Request, error: IntegrityError) -> JSONResponse:
    return JSONResponse(status_code=409, content={"detail": "Изменение нарушает уникальность или связи данных."})


def database_error_handler(request: Request, error: OperationalError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": "База данных недоступна. Повторите запрос позже."})
