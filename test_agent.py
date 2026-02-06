import sys
sys.path.append('.')

from dotenv import load_dotenv
load_dotenv()
from app.services.agent_services import chat_with_agent  # Tests full flow, but needs DB
print("Testing direct agent...")

from app.agents.task_agent import get_task_agent, run_agent_sync

# Mock data from DB (task 5: helper_backend)
instructions = get_task_agent(
    agent_name="helper_backend Assistant",
    purpose="Help with task: helper_backend. help me backend",
    task_title="helper_backend",
    task_description="help me backend",
    user_name="test_user"  # Assume
)

message = "hi"
response = run_agent_sync(instructions, message)
print(f"Test 'hi' response: {response}")
