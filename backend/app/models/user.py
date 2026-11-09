from sqlmodel import Field
from sqlmodel import Field, Relationship
from datetime import datetime, timezone

from backend.app.schemas.user import UserBase

class User(UserBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    name: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tasks: list["Task"] = Relationship(sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    schedules: list["Schedule"] = Relationship(sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    pomodoros: list["Pomodoro"] = Relationship(sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    deadlines: list["Deadline"] = Relationship(sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    courses: list["Course"] = Relationship(sa_relationship_kwargs={"cascade": "all, delete-orphan"})