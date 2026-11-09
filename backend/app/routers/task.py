from typing import Annotated
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from backend.app.database import SessionDep
from backend.app.schemas.task import TaskCreate, TaskUpdate
from backend.app.models.task import Task
from backend.app.enums import Urgency, Scope
from backend.app.dependencies import CurrentUserDep

router = APIRouter(prefix="/api/tasks", tags=["task"])


@router.post("/", response_model=Task)
def create_task(task: TaskCreate, user: CurrentUserDep, session: SessionDep):
    db_task = Task.model_validate(task)
    db_task.user_id = user.id

    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@router.get("/", response_model=list[Task])
def read_tasks(session: SessionDep, user: CurrentUserDep, urgency: Urgency | None = None, completed: bool | None = None, scope: Scope | None = None, offset: int = 0, limit: Annotated[int, Query(le=100)] = 100):
    query = select(Task).where(Task.user_id == user.id)

    if urgency is not None:
        query = query.where(Task.urgency == urgency)
    if completed is not None:
        query = query.where(Task.completed == completed)
    if scope is not None:
        query = query.where(Task.scope == scope)

    db_task = session.exec(query.offset(offset).limit(limit)).all()
    return db_task

@router.get("/{task_id}", response_model=Task)
def read_task(task_id: int, user: CurrentUserDep, session: SessionDep):
    db_task = session.get(Task, task_id)
    if not db_task or db_task.user_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@router.patch("/{task_id}", response_model=Task)
def update_task(task_id: int, session: SessionDep, user: CurrentUserDep, task: TaskUpdate):
    db_task = session.get(Task, task_id)
    if not db_task or db_task.user_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    task_data = task.model_dump(exclude_unset=True)
    db_task.sqlmodel_update(task_data)
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@router.delete("/{task_id}")
def delete_task(task_id: int, user: CurrentUserDep, session: SessionDep):
    db_task = session.get(Task, task_id)
    if not db_task or db_task.user_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(db_task)
    session.commit()
    return {"ok": True}

