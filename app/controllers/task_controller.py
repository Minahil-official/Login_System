from sqlalchemy.orm import Session
from app.services import task_services
from app.models.user import User
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskTypeUpdate
from app.models.task import Task


def create_task_controller(db: Session, user: User, task_data: TaskCreate):
    return task_services.create_task(db, user, task_data)

def get_tasks_controller(db: Session, current_user: User, skip: int = 0, limit: int = 100):
    # Only fetch tasks belonging to the current logged-in user
    return db.query(Task)\
             .filter(Task.user_id == current_user.id)\
             .offset(skip)\
             .limit(limit)\
             .all()

def get_task_controller(db: Session, user: User, task_id: int):
    return task_services.get_task_by_id(db, user, task_id)

def update_task_controller(db: Session, user: User, task_id: int, task_data: TaskUpdate):
    return task_services.update_task(db, user, task_id, task_data)

def update_task_status_controller(db: Session, user: User, task_id: int, status_data: TaskStatusUpdate):
    return task_services.update_task_status(db, user, task_id, status_data)

def update_task_type_controller(db: Session, user: User, task_id: int, type_data: TaskTypeUpdate):
    return task_services.update_task_type(db, user, task_id, type_data)

def delete_task_controller(db: Session, user: User, task_id: int):
    return task_services.delete_task(db, user, task_id)

def get_task_summary_controller(db: Session, user: User):
    return task_services.get_task_summary(db, user)
