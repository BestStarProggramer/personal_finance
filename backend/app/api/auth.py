from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.api.dependencies import CurrentUser, DatabaseSession
from app.core.config import get_settings
from app.schemas.auth import LoginRequest, RegisterRequest, TokenRead, UserRead
from app.services import auth

COOKIE_NAME = "finance_refresh"
COOKIE_PATH = "/api/auth"


def validate_origin(request: Request) -> None:
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return
    origin = request.headers.get("origin")
    allowed = [*get_settings().allowed_origins, str(request.base_url).rstrip("/")]
    if origin is not None and origin not in allowed:
        raise HTTPException(status_code=403, detail="Источник запроса не разрешён.")
    if request.headers.get("sec-fetch-site") == "cross-site":
        raise HTTPException(status_code=403, detail="Источник запроса не разрешён.")


router = APIRouter(prefix="/auth", tags=["Authentication"], dependencies=[Depends(validate_origin)])


def token_response(response: Response, result: tuple[TokenRead, str]) -> TokenRead:
    token, raw = result
    response.set_cookie(COOKIE_NAME, raw, max_age=token.refresh_expires_in, httponly=True, secure=get_settings().cookie_secure, samesite="lax", path=COOKIE_PATH)
    response.headers["Cache-Control"] = "no-store"
    return token


@router.post("/register", response_model=TokenRead, status_code=201)
def register(data: RegisterRequest, session: DatabaseSession, response: Response):
    return token_response(response, auth.register(session, data))


@router.post("/login", response_model=TokenRead)
def login(data: LoginRequest, session: DatabaseSession, response: Response):
    return token_response(response, auth.login(session, data))


@router.post("/refresh", response_model=TokenRead)
def refresh(request: Request, session: DatabaseSession, response: Response):
    return token_response(response, auth.refresh(session, request.cookies.get(COOKIE_NAME)))


@router.get("/me", response_model=UserRead)
def me(user: CurrentUser, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return user


@router.post("/logout", status_code=204)
def logout(request: Request, session: DatabaseSession, response: Response):
    header = request.headers.get("authorization", "")
    bearer = header[7:] if header.lower().startswith("bearer ") else None
    auth.logout(session, request.cookies.get(COOKIE_NAME), bearer)
    response.delete_cookie(COOKIE_NAME, path=COOKIE_PATH, httponly=True, secure=get_settings().cookie_secure, samesite="lax")
    response.headers["Cache-Control"] = "no-store"
