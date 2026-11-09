from typing import Annotated
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from backend.app.database import SessionDep
from backend.app.schemas.deadline import DeadlineCreate, DeadlineUpdate
from backend.app.models.deadline import Deadline
from backend.app.enums import Scope, DeadlineType
from backend.app.models.course import Course 
from backend.app.dependencies import CurrentUserDep

router = APIRouter(prefix="/api/deadlines", tags=["deadline"])

@router.post("/", response_model=Deadline)
def create_deadline(deadline: DeadlineCreate, user: CurrentUserDep, session: SessionDep):
    if deadline.course_id is not None:
        course = session.get(Course, deadline.course_id)
        if course is None:
            raise HTTPException(status_code=400, detail=f"Course with id {deadline.course_id} does not exist")
    
    db_deadline = Deadline.model_validate(deadline)
    db_deadline.user_id = user.id
    session.add(db_deadline) 
    session.commit()
    session.refresh(db_deadline)
    return db_deadline

@router.get("/", response_model=list[Deadline])
def read_deadlines(session: SessionDep, user: CurrentUserDep, course_id: int | None = None, type: DeadlineType | None = None, scope: Scope | None = None, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100):
    query = select(Deadline).where(Deadline.user_id == user.id)

    if course_id is not None:
        query = query.where(Deadline.course_id == course_id)
    if type is not None:
        query = query.where(Deadline.type == type)
    if scope is not None:
        query = query.where(Deadline.scope == scope)

    db_deadline = session.exec(query.offset(offset).limit(limit)).all()
    return db_deadline

@router.get("/{deadline_id}", response_model=Deadline)
def read_deadline(deadline_id: int, user: CurrentUserDep,session: SessionDep):
    db_deadline = session.get(Deadline, deadline_id)
    if not db_deadline or db_deadline.user_id != user.id:
        raise HTTPException(status_code=404, detail="Deadline not found")
    return db_deadline

@router.patch("/{deadline_id}", response_model=Deadline)
def update_deadline(deadline_id: int, user: CurrentUserDep, session: SessionDep, deadline: DeadlineUpdate):
    db_deadline = session.get(Deadline, deadline_id)
    if not db_deadline or db_deadline.user_id != user.id:
        raise HTTPException(status_code=404, detail="Deadline not found")
    deadline_data = deadline.model_dump(exclude_unset=True)
    db_deadline.sqlmodel_update(deadline_data)
    session.add(db_deadline)
    session.commit()
    session.refresh(db_deadline)
    return db_deadline

@router.delete("/{deadline_id}")
def delete_deadline(deadline_id: int, user: CurrentUserDep, session: SessionDep):
    db_deadline = session.get(Deadline, deadline_id)
    if not db_deadline or db_deadline.user_id != user.id:
        raise HTTPException(status_code=404, detail="Deadline not found")
    session.delete(db_deadline)
    session.commit()
    return {"ok": True}