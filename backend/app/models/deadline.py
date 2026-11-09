from sqlmodel import Field, Relationship
from typing import Optional

from backend.app.schemas.deadline import DeadlineBase

class Deadline(DeadlineBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    course: Optional["Course"] = Relationship(back_populates="deadlines")
    user_id: int | None = Field(default=None, foreign_key="user.id", index=True)
    