# apps/ai-runner/tests/test_openai_adapter.py
import asyncio
from unittest.mock import AsyncMock, patch
import pytest
from app.providers.base import TaskInput, ProviderError
from app.providers.text.openai_adapter import OpenAIAdapter, register_openai
from app.providers import registry


def test_openai_execute_returns_text():
    register_openai()
    adapter = registry.get("openai")
    task = TaskInput(kind="text", params={"prompt": "say hi"}, user_api_key="sk-test")

    fake = AsyncMock()
    fake.json.return_value = {"choices": [{"message": {"content": "hi"}}]}
    fake.raise_for_status = lambda: None

    with patch("httpx.AsyncClient.post", AsyncMock(return_value=fake)):
        out = asyncio.run(adapter.execute(task))
    assert out.output == "hi"


def test_openai_invalid_key_raises_provider_error():
    register_openai()
    adapter = registry.get("openai")
    task = TaskInput(kind="text", params={"prompt": "hi"}, user_api_key="sk-bad")

    import httpx
    fake_resp = AsyncMock()
    fake_resp.status_code = 401
    http_err = httpx.HTTPStatusError("401", request=httpx.Request("POST", "x"), response=httpx.Response(401))
    with patch("httpx.AsyncClient.post", AsyncMock(side_effect=http_err)):
        with pytest.raises(ProviderError) as exc:
            asyncio.run(adapter.execute(task))
    assert exc.value.code == "INVALID_KEY"
