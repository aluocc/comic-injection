# apps/ai-runner/app/tasks/worker.py
import httpx
from arq.connections import RedisSettings
from app.tasks.models import TaskPayload
from app.executor.runner import run_task
from app.providers.text.openai_adapter import register_openai
from app.config import settings

register_openai()

async def execute_task(ctx, payload_dict: dict):
    payload = TaskPayload(**payload_dict)
    try:
        result = await run_task(payload)
        # 图像/视频生成任务需要传入 kind
        if payload.kind in ("image_generation", "video_generation"):
            await _report(payload.task_id, "succeeded", {"output": result.get("output"), "kind": payload.kind})
        else:
            await _report(payload.task_id, "succeeded", result)
    except Exception as e:
        await _report(payload.task_id, "failed", {"error": str(e)})
        raise

async def _report(task_id: str, status: str, body: dict):
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{settings.api_gateway_url}/internal/tasks/{task_id}",
            json={"status": status, **body},
            headers={"x-internal-secret": settings.internal_secret},
            timeout=30,
        )

class WorkerSettings:
    functions = [execute_task]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
