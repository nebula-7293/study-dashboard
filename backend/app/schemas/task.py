from sqlmodel import SQLModel
from datetime import date

from backend.app.enums import Scope, Urgency

class TaskBase(SQLModel):
    title: str
    description: str | None = None
    urgency: Urgency = Urgency.MEDIUM
    completed: bool = False
    scope: Scope = Scope.UNI
    due_date: date | None = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    urgency: Urgency | None = None
    completed: bool | None = None
    scope: Scope | None = None
    due_date: date | None = None