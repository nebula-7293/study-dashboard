from sqlmodel import Field, SQLModel
from datetime import date
from enum import StrEnum
from backend.app.models.enums import Scope

class Urgency(StrEnum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: str | None = Field(index=True)
    urgency: Urgency = Field(index=True)
    completed: bool = Field(default=False)
    scope: Scope = Field(default=Scope.UNI, index=True)
    due_date: date | None = Field(default=None)