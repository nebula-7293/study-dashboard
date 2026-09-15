from typing import Annotated
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from backend.app.database import SessionDep
from backend.app.schemas.schedule import ScheduleCreate, ScheduleUpdate
from backend.app.models.schedule import Schedule
from backend.app.models.course import Course
from backend.app.enums import Scope, Occasion

router = APIRouter(prefix="/api/schedules", tags=["schedule"])

@router.post("/", response_model=Schedule)
def create_schedule(schedule: ScheduleCreate, session: SessionDep):
    if schedule.course_id is not None:
        course = session.get(Course, schedule.course_id)
        if not course:
            raise HTTPException(status_code=400, detail="Course does not exist")
        
    db_schedule = Schedule.model_validate(schedule)
    session.add(db_schedule)
    session.commit()
    session.refresh(db_schedule)
    return db_schedule

@router.get("/", response_model=list[Schedule])
def read_schedules(session: SessionDep, type: Occasion | None = None, location: str | None = None, scope: Scope | None = None, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100):
    query = select(Schedule)

    if type is not None: 
        query = query.where(Schedule.type == type)
    if location is not None: 
        query = query.where(Schedule.location == location)
    if scope is not None:
        query = query.where(Schedule.scope == scope)

    db_schedule = session.exec(query.offset(offset).limit(limit)).all()
    return db_schedule

@router.get("/{schedule_id}", response_model=Schedule)
def read_schedule(schedule_id: int, session: SessionDep):
    db_schedule = session.get(Schedule, schedule_id)
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return db_schedule

@router.patch("/{schedule_id}", response_model=Schedule)
def update_schedule(schedule_id: int, session: SessionDep, schedule: ScheduleUpdate):
    db_schedule = session.get(Schedule, schedule_id)
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    schedule_data = schedule.model_dump(exclude_unset=True)
    db_schedule.sqlmodel_update(schedule_data)
    session.add(db_schedule)
    session.commit()
    session.refresh(db_schedule)
    return db_schedule

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, session: SessionDep):
    db_schedule = session.get(Schedule, schedule_id)
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    session.delete(db_schedule)
    session.commit()
    return {"ok": True}