from sqlalchemy.orm import Session
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskTypeUpdate
from fastapi import HTTPException, status

def create_task(db: Session, user: User, task_data: TaskCreate):
    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        task_type=task_data.task_type,
        user_id=user.id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Create an agent for this task automatically
    from app.models.agent import Agent

    agent = Agent(
        agent_name=f"{task_data.title} Assistant",
        purpose=f"Help with task: {task_data.title}. {task_data.description or 'No description provided'}",
        task_id=new_task.id
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)

    return new_task

def get_user_tasks(db: Session, user: User, skip: int = 0, limit: int = 100):
    return db.query(Task).filter(Task.user_id == user.id).offset(skip).limit(limit).all()

def get_task_by_id(db: Session, user: User, task_id: int):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task

def update_task(db: Session, user: User, task_id: int, task_data: TaskUpdate):
    task = get_task_by_id(db, user, task_id)

    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description

    db.commit()
    db.refresh(task)
    return task

def update_task_status(db: Session, user: User, task_id: int, status_data: TaskStatusUpdate):
    task = get_task_by_id(db, user, task_id)
    task.status = status_data.status
    db.commit()
    db.refresh(task)
    return task

def update_task_type(db: Session, user: User, task_id: int, type_data: TaskTypeUpdate):
    task = get_task_by_id(db, user, task_id)
    task.task_type = type_data.task_type
    db.commit()
    db.refresh(task)
    return task

def delete_task(db: Session, user: User, task_id: int):
    task = get_task_by_id(db, user, task_id)
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}

def get_task_summary(db: Session, user: User):
    tasks = db.query(Task).filter(Task.user_id == user.id).all()

    total = len(tasks)
    pending = sum(1 for t in tasks if t.status == TaskStatus.PENDING)
    in_progress = sum(1 for t in tasks if t.status == TaskStatus.IN_PROGRESS)
    completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)

    return {
        "total_tasks": total,
        "pending": pending,
        "in_progress": in_progress,
        "completed": completed
    }
