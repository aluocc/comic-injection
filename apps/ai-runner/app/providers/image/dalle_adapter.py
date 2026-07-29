# apps/ai-runner/app/providers/image/dalle_adapter.py
import httpx
from app.providers.image.base import (
    ImageProviderAdapter,
    ImageTaskInput,
    ImageTaskResult,
    ImageProviderError,
)


class DALLEAdapter(ImageProviderAdapter):
    """DALL·E 适配器（OpenAI）"""
    name = "dalle"
    API_URL = "https://api.openai.com/v1/images/generations"

    async def generate(self, task: ImageTaskInput) -> ImageTaskResult:
        headers = {
            "Authorization": f"Bearer {task.user_api_key}",
            "Content-Type": "application/json",
        }
        # DALL·E 3 支持 1024x1024, 1792x1024, 1024x1792
        size = "1024x1024"
        if task.width > task.height:
            size = "1792x1024"
        elif task.height > task.width:
            size = "1024x1792"

        body = {
            "model": "dall-e-3",
            "prompt": task.prompt,
            "n": 1,
            "size": size,
            "response_format": "url",
        }

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

        url = data["data"][0]["url"]
        return ImageTaskResult(url=url, metadata={"model": "dall-e-3", "size": size})