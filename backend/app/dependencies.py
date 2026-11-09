from fastapi import Cookie, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated
from fastapi import Depends
import jwt

from backend.app.database import SessionDep
from backend.app.models.user import User
from backend.app.services.security import SECRET_KEY, ALGORITHM

security = HTTPBearer() 


def get_current_user(session: SessionDep, access_token: Annotated[str | None, Cookie()] = None,) -> User:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired", headers={"WWW-Authenticate": "Bearer"})

    user_id = payload.get("sub")
    user = session.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found", headers={"WWW-Authenticate": "Bearer"})
    
    return user

CurrentUserDep = Annotated[User, Depends(get_current_user)]

def read_current_user(current_user: CurrentUserDep):
    return current_user