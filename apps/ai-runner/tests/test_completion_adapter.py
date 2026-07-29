# apps/ai-runner/tests/test_completion_adapter.py
import asyncio
from unittest.mock import AsyncMock, patch
from app.providers.base import TaskInput, ProviderError
from app.providers.text.completion_adapter import CompletionAdapter, register_completion
from app.providers import registry


def test_completion_execute_returns_text():
    register_completion()
    adapter = registry.get("completion")
    task = TaskInput(kind="text", params={"operation": "generate", "prompt": "say hi"}, user_api_key="sk-test")

    fake = AsyncMock()
    fake.json.return_value = {
        "choices": [{"message": {"content": "hello"}}],
        "usage": {"total_tokens": 10},
    }
    fake.raise_for_status = lambda: None

    with patch("httpx.AsyncClient.post", AsyncMock(return_value=fake)):
        out = asyncio.run(adapter.execute(task))
    assert out.output == "hello"
    assert out.meta["usage"]["total_tokens"] == 10


def test_completion_invalid_key_raises():
    register_completion()
    adapter = registry.get("completion")
    task = TaskInput(kind="text", params={"prompt": "hi"}, user_api_key="sk-bad")

    import httpx
    fake_resp = AsyncMock()
    fake_resp.status_code = 401
    http_err = httpx.HTTPStatusError("401", request=httpx.Request("POST", "x"), response=httpx.Response(401))
    with patch("httpx.AsyncClient.post", AsyncMock(side_effect=http_err)):
        try:
            asyncio.run(adapter.execute(task))
            assert False, "should raise"
        except ProviderError as e:
            assert e.code == "INVALID_KEY"
