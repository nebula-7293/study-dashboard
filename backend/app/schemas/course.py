from sqlmodel import SQLModel

from backend.app.enums import Scope

class CourseBase(SQLModel):
    title: str
    code: str | None = None
    credits: float | None = None
    current_grade: float | None = None
    scope: Scope = Scope.UNI

class CourseCreate(CourseBase):
    pass

class CourseUpdate(SQLModel):
    title: str | None = None
    code: str | None = None
    credits: float | None = None
    current_grade: float | None = None
    scope: Scope | None = None