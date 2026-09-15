from sqlmodel import Field, Relationship
from typing import Optional

from backend.app.schemas.schedule import ScheduleBase


class Schedule(ScheduleBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    course: Optional["Course"] = Relationship(back_populates="schedules")