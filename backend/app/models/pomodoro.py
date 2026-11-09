from sqlmodel import Field

from backend.app.schemas.pomodoro import PomodoroBase

class Pomodoro(PomodoroBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int | None = Field(default=None, foreign_key="user.id", index=True)
    course_id: int | None = Field(default=None, foreign_key="course.id", index=True)