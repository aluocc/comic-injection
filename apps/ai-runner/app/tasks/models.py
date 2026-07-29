# apps/ai-runner/app/tasks/models.py
from pydantic import BaseModel

class TaskPayload(BaseModel):
    task_id: str
    user_id: str
    provider: str
    kind: str
    params: dict
    user_api_key: str
