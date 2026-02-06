from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class TaskTypeUpdate(BaseModel):
    task_type: str

class TaskResponse(TaskBase):
    id: int
    user_id: int
    status: TaskStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TaskSummaryResponse(BaseModel):
    total_tasks: int
    pending: int
    in_progress: int
    completed: int
