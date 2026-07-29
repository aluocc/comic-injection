# apps/ai-runner/app/providers/video/svd_adapter.py
import httpx
from app.providers.video.base import (
    VideoProviderAdapter,
    VideoTaskInput,
    VideoTaskResult,
    VideoProviderError,
)


class SVDAdapter(VideoProviderAdapter):
    """Stable Video Diffusion 适配器（Replicate API）"""
    name = "svd"
    API_URL = "https://api.replicate.com/v1/predictions"

    async def generate(self, task: VideoTaskInput) -> VideoTaskResult:
        headers = {
            "Authorization": f"Token {task.user_api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "version": "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",  # SVD 1.1
            "input": {
                "image": task.reference_image_url or task.prompt,
                "motion_bucket_id": 127,
                "fps": 6,
                "num_frames": task.duration * 6,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=300) as client:
                # 提交任务
                resp = await client.post(self.API_URL, json=body, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                prediction_id = data["id"]

                # 轮询结果
                result = await self._poll(client, prediction_id, headers)
        except httpx.HTTPStatusError as e:
            code = "INVALID_KEY" if e.response.status_code == 401 else "PROVIDER_ERROR"
            raise VideoProviderError(code, str(e))
        except httpx.HTTPError as e:
            raise VideoProviderError("NETWORK", str(e))

        return VideoTaskResult(
            url=result["output"],
            metadata={"model": "svd-1.1", "prediction_id": prediction_id},
        )

    async def _poll(self, client: httpx.AsyncClient, prediction_id: str, headers: dict) -> dict:
        import asyncio
        url = f"{self.API_URL}/{prediction_id}"
        for _ in range(60):  # 最多轮询 5 分钟
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            if data["status"] == "succeeded":
                return data
            if data["status"] == "failed":
                raise VideoProviderError("GENERATION_FAILED", data.get("error", "unknown error"))
            await asyncio.sleep(5)
        raise VideoProviderError("TIMEOUT", "video generation timed out")