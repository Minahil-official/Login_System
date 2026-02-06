from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from config.db import get_db
from app.models.user import User
from app.services.auth_services import get_current_user
from app.schemas.agent_schema import  AgentResponse, AgentChatRequest, AgentChatResponse
from app.controllers import agent_controller
from app.services.agent_services import chat_with_agent

router = APIRouter(prefix="/tasks", tags=["Agent"])

# @router.post("/{task_id}/assign_agent", response_model=AgentResponse)
# def assign_agent(
#     task_id: int,
#     agent_data: AgentCreate,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     return agent_controller.assign_agent_controller(db, task_id, current_user, agent_data)

# @router.get("/{task_id}/agent", response_model=AgentResponse)
# def get_agent(
#     task_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     return agent_controller.get_agent_controller(db, task_id, current_user)

@router.post("/{task_id}/chat")
def chat_task(
    task_id: int,
    chat_data: AgentChatRequest,   # ✅ schema
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return agent_controller.chat_agent_controller(
        db,
        task_id,
        current_user,
        chat_data
    )

@router.post("/app-guide/chat")
def chat_app_guide(
    chat_data: AgentChatRequest,
    current_user: User = Depends(get_current_user)
):
    """General Purpose Agent - explains how the app works"""
    return agent_controller.chat_app_guide_controller(
        current_user,
        chat_data
    )