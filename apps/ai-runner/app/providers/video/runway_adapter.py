# apps/ai-runner/app/providers/video/runway_adapter.py
import httpx
from app.providers.video.base import (
    VideoProviderAdapter,
    VideoTaskInput,
    VideoTaskResult,
    VideoProviderError,
)


class RunwayAdapter(VideoProviderAdapter):
    """Runway Gen-3 适配器"""
    name = "runway"
    API_URL = "https://api.runwayml.com/v1/generations"

    async def generate(self, task: VideoTaskInput) -> VideoTaskResult:
        headers = {
            "Authorization": f"Bearer {task.user_api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "taskType": "gen3a_turbo",
            "promptText": task.prompt,
            "seconds": min(task.duration, 10),
        }
        if task.reference_image_url:
            body["imageUrl"] = task.reference_image_url

        try:
            async with httpx.AsyncClient(timeout=300) as client:
                resp = await client.post(self.API_URL, json=body, headers=headers)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as e:
            code = "INVALID_KEY" if e.response.status_code == 401 else "PROVIDER_ERROR"
            raise VideoProviderError(code, str(e))
        except httpx.HTTPError as e:
            raise VideoProviderError("NETWORK", str(e))

        # Runway 返回任务 ID，需要轮询
        task_id = data.get("id", "")
        result = await self._poll(client, task_id, headers)
        return VideoTaskResult(
            url=result["url"],
            metadata={"model": "gen3a-turbo", "task_id": task_id},
        )

    async def _poll(self, client: httpx.AsyncClient, task_id: str, headers: dict) -> dict:
        import asyncio
        url = f"{self.API_URL}/{task_id}"
        for _ in range(60):
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            if data.get("status") == "succeeded":
                return data
            if data.get("status") == "failed":
                raise VideoProviderError("GENERATION_FAILED", data.get("error", "unknown error"))
            await asyncio.sleep(5)
        raise VideoProviderError("TIMEOUT", "video generation timed out")