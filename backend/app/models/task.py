from sqlmodel import Field
from backend.app.schemas.task import TaskBase
from backend.app.models.enums import Urgency

class Task(TaskBase, table=True):
    id: int | None = Field(default=None, primary_key=True)