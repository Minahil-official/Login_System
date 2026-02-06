from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from config.db import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String, nullable=False)
    purpose = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Link to Task
    task_id = Column(Integer, ForeignKey("tasks.id"))

    # Relationship to Task
    task = relationship("Task", back_populates="agent")
