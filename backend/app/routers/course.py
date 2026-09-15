from typing import Annotated
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from backend.app.database import SessionDep
from backend.app.schemas.course import CourseCreate, CourseUpdate
from backend.app.models.course import Course
from backend.app.enums import Scope
from backend.app.services.gpa_calc import calculate_gpa

router = APIRouter(prefix="/api/courses", tags=["course"])

@router.post("/", response_model=Course)
def create_course(course: CourseCreate, session: SessionDep):
    db_course = Course.model_validate(course)
    session.add(db_course)
    session.commit()
    session.refresh(db_course)
    return db_course

@router.get("/", response_model=list[Course])
def read_courses(session: SessionDep, scope: Scope | None = None, offset: int=0, limit: Annotated[int, Query(le=100)] = 100):
    query = select(Course)

    if scope is not None:
        query = query.where(Course.scope == scope)

    db_course = session.exec(query.offset(offset).limit(limit)).all()
    return db_course

@router.get("/gpa")
def get_gpa(session: SessionDep, scope: Scope | None = None):
    query = select(Course)
    if scope is not None:
        query = query.where(Course.scope == scope)
    courses = session.exec(query).all()
    
    return calculate_gpa(courses)

@router.get("/{course_id}", response_model=Course)
def read_course(course_id: int, session: SessionDep):
    db_course = session.get(Course, course_id)
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    return db_course

@router.patch("/{course_id}", response_model=Course)
def update_course(course_id: int, session: SessionDep, course: CourseUpdate):
    db_course = session.get(Course, course_id)
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    course_data = course.model_dump(exclude_unset=True)
    db_course.sqlmodel_update(course_data)
    session.add(db_course)
    session.commit()
    session.refresh(db_course)
    return db_course

@router.delete("/{course_id}")
def delet_course(course_id: int, session: SessionDep):
    db_course = session.get(Course, course_id)
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    session.delete(db_course)
    session.commit()
    return {"ok": True}