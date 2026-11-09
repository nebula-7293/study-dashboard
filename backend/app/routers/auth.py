from fastapi import APIRouter, HTTPException, status, Response
from sqlmodel import select

from backend.app.database import SessionDep
from backend.app.models.user import User
from backend.app.schemas.user import UserCreate, UserRead, UserLogin, UserUpdate, Token
from backend.app.services.security import hash_password, verify_password, create_access_token
from backend.app.dependencies import CurrentUserDep

router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.post('/register', response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, session: SessionDep):
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists", headers={"WWW-Authenticate": "Bearer"})

    hashed_password = hash_password(user_data.password)
    new_user = User(email=user_data.email, name=user_data.name, hashed_password=hashed_password)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.post('/login')
def login(user_data: UserLogin, response: Response, session: SessionDep):
    user = session.exec(select(User).where(User.email == user_data.email)).first()

    if not user or not verify_password(user.hashed_password, user_data.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password", headers={"WWW-Authenticate": "Bearer"})

    access_token = create_access_token(data={"sub": str(user.id), "name": user.name})

    response.set_cookie(key="access_token", value=access_token, httponly=True, samesite="lax", secure=False, max_age=1800, path="/")

    return {"message": "Login successful", "name": user.name}

@router.post('/logout', status_code=status.HTTP_200_OK)
def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logout successful"}

@router.get("/me", response_model=UserRead)
def get_me(current_user: CurrentUserDep):
    return current_user

@router.patch("/me", response_model=UserRead)
def update_me(user_update: UserUpdate, current_user: CurrentUserDep, session: SessionDep):
    user_data = user_update.model_dump(exclude_unset=True)

    if "password" in user_data:
        user_data["hashed_password"] = hash_password(user_data.pop("password"))

    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(current_user: CurrentUserDep, session: SessionDep):
    session.delete(current_user)
    session.commit()