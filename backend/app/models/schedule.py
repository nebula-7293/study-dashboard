from sqlmodel import Field, SQLModel
from datetime import time

from backend.app.schemas.schedule import ScheduleBase


class Schedule(ScheduleBase, table=True):
    id: int | None = Field(default=None, primary_key=True)