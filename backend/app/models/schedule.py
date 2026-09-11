from sqlmodel import Field, SQLModel
from datetime import time
from enum import StrEnum
from backend.app.models.enums import Scope

class Weekdays(StrEnum):
    Monday = "Monday"
    Tuesday = "Tuesday"
    Wednesday = "Wednesday"
    Thursday = "Thursday"
    Friday = "Friday"
    Saturday = "Saturday"
    Sunday = "Sunday"

class Schedule(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: str | None = Field(default=None)
    start_time: time = Field(default=None)
    end_time: time = Field(default=None)
    day: Weekdays = Field(index=True)
    scope: Scope = Field(default=Scope.UNI, index=True)
    location: str = Field(default="", index=True)