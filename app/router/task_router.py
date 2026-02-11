from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from config.db import get_db
from app.models.user import User
from app.services.auth_services import get_current_user
from app.schemas.task_schema import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskStatusUpdate,
    TaskTypeUpdate,
    TaskSummaryResponse
)
from app.controllers import task_controller

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return task_controller.create_task_controller(db, current_user, task_data)

@router.get("/", response_model=List[TaskResponse])
def get_tasks(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return task_controller.get_tasks_controller(db, current_user, skip, limit)



@router.get("/summary", response_model=TaskSummaryResponse)
def get_task_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get summary of tasks (counts by status).
    Useful for popup UI headers/badges.
    """
    return task_controller.get_task_summary_controller(db, current_user)

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return task_controller.get_task_controller(db, current_user, task_id)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return task_controller.update_task_controller(db, current_user, task_id, task_data)

@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    status_data: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update only the status of a task.
    """
    return task_controller.update_task_status_controller(db, current_user, task_id, status_data)

@router.patch("/{task_id}/type", response_model=TaskResponse)
def update_task_type(
    task_id: int,
    type_data: TaskTypeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update only the type of a task.
    """
    return task_controller.update_task_type_controller(db, current_user, task_id, type_data)

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return task_controller.delete_task_controller(db, current_user, task_id)
