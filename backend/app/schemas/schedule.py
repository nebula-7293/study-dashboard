from sqlmodel import SQLModel, Field
from datetime import time

from backend.app.enums import Scope, Weekdays

class ScheduleBase(SQLModel):
    title: str
    description: str | None = None
    day: Weekdays = Weekdays.Monday
    start_time: time = Field(default="00:00")
    end_time: time = Field(default="00:00")
    location: str | None = None
    scope: Scope = Scope.UNI

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    day: Weekdays | None = None
    start_time: time | None = None
    end_time: time | None = None
    location: str | None = None
    scope: Scope | None = None
