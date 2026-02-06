from sqlalchemy.orm import Session
from app.services import agent_services
from app.models.user import User
from app.schemas.agent_schema import  AgentChatRequest

# def assign_agent_controller(db: Session, task_id: int, user: User, agent_data: AgentCreate):
#     return agent_services.assign_agent_to_task(db, task_id, user, agent_data)

# def get_agent_controller(db: Session, task_id: int, user: User):
#     return agent_services.get_agent_by_task(db, task_id, user)

def chat_agent_controller(db: Session, task_id: int, user: User, chat_data: AgentChatRequest):
    return agent_services.chat_with_agent(db, task_id, user, chat_data.message)

def chat_app_guide_controller(user: User, chat_data: AgentChatRequest):
    """Handle General Purpose Agent chat - no DB needed, no task context"""
    return agent_services.chat_with_app_guide(user, chat_data.message)
