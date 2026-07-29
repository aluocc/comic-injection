# apps/ai-runner/app/providers/text/script_adapter.py
import json
import httpx
from app.providers.base import ProviderAdapter, TaskInput, TaskResult, ProviderError
from app.providers.registry import register

SYSTEM_PROMPT = """你是专业剧本改编师。将小说/文章转换为结构化分场表。
输出 JSON 对象：{"scenes": [{"sceneNo": number, "location": "INT|EXT|INT./EXT.", "time": "DAY|NIGHT|DAWN|DUSK|CONTINUOUS", "characters": string[], "actionSummary": string}]}
仅返回 JSON，不要解释。"""

class ScriptAdapter(ProviderAdapter):
    name = "script"
    BASE_URL = "https://api.openai.com/v1/chat/completions"

    async def execute(self, task: TaskInput) -> TaskResult:
        params = task.params
        body = {
            "model": params.get("model", "gpt-4o-mini"),
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": params.get("source_text", "")},
            ],
            "response_format": {"type": "json_object"},
        }
        headers = {"Authorization": f"Bearer {task.user_api_key}"}
        try:
            async with httpx.AsyncClient(timeout=90) as client:
                resp = await client.post(self.BASE_URL, json=body, headers=headers)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as e:
            code = "INVALID_KEY" if e.response.status_code == 401 else "PROVIDER_ERROR"
            raise ProviderError(code, str(e))
        except httpx.HTTPError as e:
            raise ProviderError("NETWORK", str(e))

        content = data["choices"][0]["message"]["content"]
        try:
            parsed = json.loads(content)
            scenes = parsed if isinstance(parsed, list) else parsed.get("scenes", [])
        except json.JSONDecodeError as e:
            raise ProviderError("PARSE_ERROR", f"invalid JSON: {e}")
        return TaskResult(output={"scenes": scenes}, meta={"model": body["model"]})

def register_script() -> None:
    register(ScriptAdapter())
