from sqlmodel import Field
from backend.app.schemas.schedule import ScheduleBase


class Schedule(ScheduleBase, table=True):
    id: int | None = Field(default=None, primary_key=True)