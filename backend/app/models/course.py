from sqlmodel import Field, SQLModel, Relationship
from backend.app.models.enums import Scope
from typing import Optional

class Course(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    code: str = Field(index=True)
    credits: int = Field(default=None)
    grade: float | None = Field(default=None)
    target_grade: float | None = Field(default=None)
    scope: Scope = Field(default=Scope.UNI, index=True)
    deadlines: list["Deadline"] = Relationship(back_populates="course")