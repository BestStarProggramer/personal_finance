from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError


def validation_error_handler(request: Request, error: RequestValidationError) -> JSONResponse:
    # Do not echo input values: validation errors may contain passwords.
    details = [{"loc": problem["loc"], "msg": problem["msg"], "type": problem["type"]} for problem in error.errors()]
    return JSONResponse(status_code=422, content={"detail": details})


def integrity_error_handler(request: Request, error: IntegrityError) -> JSONResponse:
    return JSONResponse(status_code=409, content={"detail": "Изменение нарушает уникальность или связи данных."})


def database_error_handler(request: Request, error: OperationalError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": "База данных недоступна. Повторите запрос позже."})
