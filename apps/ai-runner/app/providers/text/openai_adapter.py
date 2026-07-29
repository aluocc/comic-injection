# apps/ai-runner/app/providers/text/openai_adapter.py
import httpx
from app.providers.base import ProviderAdapter, TaskInput, TaskResult, ProviderError
from app.providers.registry import register

class OpenAIAdapter(ProviderAdapter):
    name = "openai"
    BASE_URL = "https://api.openai.com/v1/chat/completions"

    async def execute(self, task: TaskInput) -> TaskResult:
        params = task.params
        body = {
            "model": params.get("model", "gpt-4o-mini"),
            "messages": [{"role": "user", "content": params.get("prompt", "")}],
        }
        headers = {"Authorization": f"Bearer {task.user_api_key}"}
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(self.BASE_URL, json=body, headers=headers)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as e:
            code = "INVALID_KEY" if e.response.status_code == 401 else "PROVIDER_ERROR"
            raise ProviderError(code, str(e))
        except httpx.HTTPError as e:
            raise ProviderError("NETWORK", str(e))

        text = data["choices"][0]["message"]["content"]
        return TaskResult(output=text, meta={"model": body["model"]})

def register_openai() -> None:
    register(OpenAIAdapter())
