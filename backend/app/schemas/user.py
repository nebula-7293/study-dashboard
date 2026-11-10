from sqlmodel import SQLModel
from datetime import datetime, date
from pydantic import EmailStr

class UserBase(SQLModel):
    email: EmailStr
    name: str
    university: str | None = None
    year_of_study: int | None = None
    date_of_birth: date | None = None
    created_at: datetime | None = None

class UserCreate(UserBase):
    password: str

class UserLogin(SQLModel):
    email: EmailStr
    password: str

class UserRead(UserBase):
    id: int
    created_at: datetime

class UserUpdate(SQLModel):
    email: EmailStr | None = None
    password: str | None = None
    name: str | None = None
    university: str | None = None
    year_of_study: int | None = None
    date_of_birth: date | None = None


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str