from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.models import User
from app.services.auth import current_user, unauthorized

DatabaseSession = Annotated[Session, Depends(get_session)]
bearer = HTTPBearer(auto_error=False)


def get_current_user(session: DatabaseSession, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized()
    return current_user(session, credentials.credentials)


CurrentUser = Annotated[User, Depends(get_current_user)]
