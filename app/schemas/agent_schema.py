from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# class AgentCreate(BaseModel):
#     agent_name: str
#     purpose: str

class AgentResponse(BaseModel):
    id: int
    task_id: int
    agent_name: str
    purpose: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AgentChatRequest(BaseModel):
    message: str

class AgentChatResponse(BaseModel):
    response: str
    agent_name: str
    timestamp: datetime
