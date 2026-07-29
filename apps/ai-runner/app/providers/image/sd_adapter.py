# apps/ai-runner/app/providers/image/sd_adapter.py
import httpx
from app.providers.image.base import (
    ImageProviderAdapter,
    ImageTaskInput,
    ImageTaskResult,
    ImageProviderError,
)


class SDAdapter(ImageProviderAdapter):
    """Stable Diffusion 适配器（Stability AI）"""
    name = "sd"
    API_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"

    async def generate(self, task: ImageTaskInput) -> ImageTaskResult:
        headers = {
            "Authorization": f"Bearer {task.user_api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "text_prompts": [{"text": task.prompt, "weight": 1.0}],
            "cfg_scale": 7,
            "height": task.height,
            "width": task.width,
            "steps": 30,
        }
        if task.negative_prompt:
            body["text_prompts"].append({"text": task.negative_prompt, "weight": -1.0})

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(self.API_URL, json=body, headers=headers)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as e:
            code = "INVALID_KEY" if e.response.status_code == 401 else "PROVIDER_ERROR"
            raise ImageProviderError(code, str(e))
        except httpx.HTTPError as e:
            raise ImageProviderError("NETWORK", str(e))

        # Stability AI 返回 base64 图片，简化为 data URL（实际应上传到 MinIO）
        img = data["artifacts"][0]
        url = f"data:image/png;base64,{img['base64']}"
        return ImageTaskResult(url=url, metadata={"seed": img.get("seed"), "model": "sd-xl"})