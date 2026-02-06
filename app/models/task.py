import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from config.db import Base

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)

    # New fields
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    task_type = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Establish relationship with User
    owner = relationship("User", back_populates="tasks")

    # Relationship with Agent
    agent = relationship("Agent", back_populates="task", uselist=False, cascade="all, delete-orphan")
