from typing import Annotated
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from backend.app.database import SessionDep
from backend.app.schemas.pomodoro import PomodoroCreate, PomodoroRead
from backend.app.models.pomodoro import Pomodoro
from backend.app.enums import Scope
from backend.app.dependencies import CurrentUserDep

router = APIRouter(prefix="/api/pomodoros", tags=["pomodoro"])


@router.post("/", response_model=PomodoroRead)
def create_pomodoro(pomodoro: PomodoroCreate, user: CurrentUserDep, session: SessionDep):
    db_pomo = Pomodoro.model_validate(pomodoro)
    db_pomo.user_id = user.id
    session.add(db_pomo)
    session.commit()
    session.refresh(db_pomo)
    return db_pomo


@router.get("/", response_model=list[PomodoroRead])
def read_pomodoros(
    session: SessionDep,
    user: CurrentUserDep,
    scope: Scope | None = None,
    offset: int = 0,
    limit: Annotated[int, Query(le=200)] = 200,
):
    query = select(Pomodoro).where(Pomodoro.user_id == user.id)
    if scope is not None:
        query = query.where(Pomodoro.scope == scope)
    results = session.exec(query.offset(offset).limit(limit)).all()
    return results


@router.delete("/{pomodoro_id}")
def delete_pomodoro(pomodoro_id: int, user: CurrentUserDep, session: SessionDep):
    db_pomo = session.get(Pomodoro, pomodoro_id)
    if not db_pomo or db_pomo.user_id != user.id:
        raise HTTPException(status_code=404, detail="Pomodoro session not found")
    session.delete(db_pomo)
    session.commit()
    return {"ok": True}
