# apps/ai-runner/app/providers/text/completion_adapter.py
import httpx
from app.providers.base import ProviderAdapter, TaskInput, TaskResult, ProviderError
from app.providers.registry import register

SYSTEM_PROMPTS = {
    "generate": "你是一位专业编剧助手，根据用户输入生成创意内容。",
    "expand": "你是一位专业编剧助手，将给定段落扩展为更详细的描写。",
    "compress": "你是一位专业编剧助手，将给定段落精简为摘要。",
    "polish": "你是一位专业编剧助手，调整文风，使文字更符合指定风格。",
    "check": "你是一位剧本审校专家，检查剧本中人物、道具、设定的一致性问题。",
    "outline": "你是一位剧本结构师，根据给定标题和摘要生成结构化分场表。",
    "nextScene": "你是一位专业编剧，根据前文续写下一场景。",
}

class CompletionAdapter(ProviderAdapter):
    name = "completion"
    BASE_URL = "https://api.openai.com/v1/chat/completions"

    async def execute(self, task: TaskInput) -> TaskResult:
        params = task.params
        operation = params.get("operation", "generate")
        system = SYSTEM_PROMPTS.get(operation, SYSTEM_PROMPTS["generate"])

        user_parts = []
        if params.get("style"):
            user_parts.append(f"风格要求：{params['style']}")
        if params.get("context"):
            user_parts.append(f"前文/上下文：\n{params['context']}")
        user_parts.append(f"任务：{params.get('prompt', '')}")
        user_prompt = "\n\n".join(user_parts)

        body = {
            "model": params.get("model", "gpt-4o-mini"),
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user_prompt},
            ],
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
        return TaskResult(output=text, meta={"model": body["model"], "usage": data.get("usage", {})})

def register_completion() -> None:
    register(CompletionAdapter())
