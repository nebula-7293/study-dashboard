from sqlmodel import SQLModel, Field
from datetime import date

from backend.app.enums import Scope, DeadlineType

class DeadlineBase(SQLModel):
    title: str 
    course_id: int | None = Field(default=None, foreign_key="course.id")
    type: DeadlineType = DeadlineType.ASSIGNMENT
    due_date: date | None = None
    scope: Scope = Scope.UNI

class DeadlineCreate(DeadlineBase):
    pass

class DeadlineUpdate(SQLModel):
    title: str | None = None
    course_id: int | None = None
    type: DeadlineType | None = None
    due_date: date | None = None
    scope: Scope | None = None