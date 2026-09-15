from sqlmodel import SQLModel, Field
from datetime import date, time

from backend.app.enums import Scope, Occasion, RepeatFrequency

class ScheduleBase(SQLModel):
    title: str
    description: str | None = None
    type: Occasion = Occasion.MISCELLANEOUS
    course_id: int | None = Field(default=None, foreign_key="course.id")
    day: date | None = Field(default_factory=date.today)
    start_time: time = Field(default="07:30")
    end_time: time = Field(default="09:10")
    repeat: RepeatFrequency = RepeatFrequency.NONE
    repeat_until: date | None = None
    location: str | None = None
    scope: Scope = Scope.UNI

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    type: Occasion | None = None
    course_id: int | None = None
    day: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    repeat: RepeatFrequency | None = None
    repeat_until: date | None = None
    location: str | None = None
    scope: Scope | None = None
