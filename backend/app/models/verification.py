from sqlmodel import SQLModel, Field
from datetime import datetime

class Verification(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    hashed_code: str
    purpose: str
    expires_at: datetime
    attempts: int = Field(default=0)