from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime
from app.models.agent import Agent          # ✅ DB Agent
from app.models.task import Task
from app.models.user import User
from app.agents.task_agent import get_task_agent, get_app_guide_agent, run_agent_sync


def get_task_ownership(db: Session, task_id: int, user: User) -> Task:
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or access denied"
        )
    return task


# def assign_agent_to_task(db: Session, task_id: int, user: User, agent_data: AgentCreate):
#     task = get_task_ownership(db, task_id, user)

#     agent = (
#     db.query(Agent)
#     .join(Task)  # join task to access user_id
#     .filter(Agent.task_id == task_id, Task.user_id == user.id)
#     .first()
# )


#     if agent:
#         agent.agent_name = agent_data.agent_name
#         agent.purpose = agent_data.purpose
#     else:
#         agent = Agent(
#             task_id=task_id,
#             agent_name=agent_data.agent_name,
#             purpose=agent_data.purpose
#         )
#         db.add(agent)

#     db.commit()
#     db.refresh(agent)
#     return agent


# def get_agent_by_task(db: Session, task_id: int, user: User):
#     get_task_ownership(db, task_id, user)

#     agent = db.query(Agent).filter(Agent.task_id == task_id).first()
#     if not agent:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Agent not found for this task"
#         )
#     return agent


def chat_with_agent(db: Session, task_id: int, user: User, message: str):
    # Ensure task exists and belongs to current user
    task = get_task_ownership(db, task_id, user)

    # Ensure agent exists for this task and belongs to the same user
    db_agent = (
        db.query(Agent)
        .join(Task)
        .filter(Agent.task_id == task_id, Task.user_id == user.id)
        .first()
    )

    if not db_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No agent assigned to this task"
        )

    instructions = get_task_agent(
        agent_name=db_agent.agent_name,
        purpose=db_agent.purpose,
        task_title=task.title,
        task_description=task.description,
        user_name=user.username
    )

    

    print(f"[DEBUG] Calling agent for task {task_id}: '{task.title}' with message: '{message}'")
    try:
        response_text = run_agent_sync(instructions, message)
        print(f"[DEBUG] Agent response for task {task_id}: {response_text[:200]}...")
    except Exception as e:
        print(f"[ERROR] Agent sync failed for task {task_id}: {str(e)}")
        response_text = "AI agent error. See backend logs for details."

    return {
        "response": response_text,
        "agent_name": db_agent.agent_name,
        "timestamp": datetime.utcnow()
    }


def chat_with_app_guide(user: User, message: str):
    """Chat with General Purpose Agent - explains how the app works"""
    print(f"[DEBUG] General Purpose Agent chat from user {user.username}: '{message}'")

    try:
        instructions = get_app_guide_agent(user_name=user.username)
        response_text = run_agent_sync(instructions, message)
        print(f"[DEBUG] General Purpose Agent response: {response_text[:200]}...")
    except Exception as e:
        print(f"[ERROR] General Purpose Agent failed: {str(e)}")
        response_text = "I'm having trouble right now. Please try again."

    return {
        "response": response_text,
        "agent_name": "General Purpose Agent",
        "timestamp": datetime.utcnow()
    }
