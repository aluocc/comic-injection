# apps/ai-runner/tests/test_runner.py
import pytest
from unittest.mock import AsyncMock
from app.tasks.models import TaskPayload
from app.executor.runner import run_task
from app.providers.base import ProviderError, TaskResult
from app.providers.text.openai_adapter import register_openai
from app.providers import registry


@pytest.mark.asyncio
async def test_run_task_success():
    register_openai()
    adapter = registry.get("openai")
    adapter.execute = AsyncMock(return_value=TaskResult(output="hi", meta={}))
    payload = TaskPayload(task_id="t1", user_id="u1", provider="openai", kind="text",
                          params={"prompt": "hi"}, user_api_key="sk-test")
    out = await run_task(payload)
    assert out["output"] == "hi"


@pytest.mark.asyncio
async def test_run_task_invalid_key_no_retry():
    register_openai()
    adapter = registry.get("openai")
    call_count = 0
    async def boom(_):
        nonlocal call_count
        call_count += 1
        raise ProviderError("INVALID_KEY", "bad")
    adapter.execute = boom
    payload = TaskPayload(task_id="t2", user_id="u1", provider="openai", kind="text",
                          params={}, user_api_key="sk-test")
    with pytest.raises(ProviderError):
        await run_task(payload)
    assert call_count == 1
