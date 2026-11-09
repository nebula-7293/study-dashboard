from sqlmodel import SQLModel, Field
from datetime import datetime

from backend.app.enums import Scope

class PomodoroBase(SQLModel):
    duration_seconds: int | None = None
    title: str
    description: str | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    scope: Scope = Scope.UNI
    course_id: int | None = Field(default=None, foreign_key="course.id")

class PomodoroCreate(PomodoroBase):
    pass

class PomodoroRead(PomodoroBase):
    id: int
    user_id: int
