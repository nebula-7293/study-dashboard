from sqlmodel import Field, SQLModel
from datetime import time
from backend.app.models.enums import Scope, Weekdays

class Schedule(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: str | None = Field(default=None)
    day: Weekdays = Field(index=True)
    start_time: time = Field(default=None)
    end_time: time = Field(default=None)
    location: str = Field(default="", index=True)
    scope: Scope = Field(default=Scope.UNI, index=True)