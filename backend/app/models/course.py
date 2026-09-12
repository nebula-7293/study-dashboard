from sqlmodel import Field, Relationship

from backend.app.schemas.course import CourseBase

class Course(CourseBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    deadlines: list["Deadline"] = Relationship(back_populates="course")