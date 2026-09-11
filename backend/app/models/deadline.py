from sqlmodel import Field, SQLModel, Relationship
from datetime import date
from backend.app.models.enums import Scope
from typing import Optional
from enum import StrEnum

class DeadlineType(StrEnum):
    ASSIGMENT = "assigment"
    EXAM = "exam"

class Deadline(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    course_id: int | None = Field(default=None, foreign_key="course.id")
    course: Optional["Course"] = Relationship(back_populates="deadlines")
    due_date: date = Field(index=True)
    type: DeadlineType = Field(index=True)
    scope: Scope = Field(default=Scope.UNI, index=True)
    