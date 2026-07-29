# apps/ai-runner/app/executor/runner.py
import asyncio
import logging
from app.providers.base import TaskInput, ProviderError
from app.providers import registry
from app.providers.image import SDAdapter, DALLEAdapter, ImageTaskInput
from app.providers.video import SVDAdapter, RunwayAdapter, VideoTaskInput

logger = logging.getLogger("executor")

MAX_RETRIES = 3
TIMEOUT_SECONDS = 120  # 图像生成耗时更长

async def run_task(payload) -> dict:
    # 图像生成任务特殊处理
    if payload.kind == "image_generation":
        return await _run_image_generation(payload)

    # 视频生成任务特殊处理
    if payload.kind == "video_generation":
        return await _run_video_generation(payload)

    # 文本任务
    adapter = registry.get(payload.provider)
    task_input = TaskInput(kind=payload.kind, params=payload.params, user_api_key=payload.user_api_key)
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            result = await asyncio.wait_for(adapter.execute(task_input), timeout=TIMEOUT_SECONDS)
            return {"output": result.output, "meta": result.meta}
        except ProviderError as e:
            if e.code in ("INVALID_KEY",):
                raise
            last_err = e
            logger.warning("attempt %d failed (%s): %s", attempt, e.code, e.message)
        except Exception as e:
            last_err = e
            logger.warning("attempt %d failed: %s", attempt, e)
    raise RuntimeError(f"task failed after {MAX_RETRIES} attempts: {last_err}")

async def _run_image_generation(payload) -> dict:
    """执行图像生成任务"""
    params = payload.params
    task_input = ImageTaskInput(
        prompt=params.get("prompt", ""),
        negative_prompt=params.get("negative_prompt", ""),
        width=params.get("width", 512),
        height=params.get("height", 512),
        style=params.get("style", ""),
        model=params.get("model", "sd"),
        user_api_key=payload.user_api_key,
    )
    
    adapter = SDAdapter() if task_input.model == "sd" else DALLEAdapter()
    
    try:
        result = await adapter.generate(task_input)
        return {"output": {"url": result.url, "metadata": result.metadata}, "meta": {"model": task_input.model}}
    except Exception as e:
        logger.error("image generation failed: %s", e)
        raise

async def _run_video_generation(payload) -> dict:
    """执行视频生成任务"""
    params = payload.params
    task_input = VideoTaskInput(
        prompt=params.get("prompt", ""),
        negative_prompt=params.get("negative_prompt", ""),
        duration=params.get("duration", 4),
        model=params.get("model", "svd"),
        user_api_key=payload.user_api_key,
        reference_image_url=params.get("reference_image_url", ""),
    )

    adapter = SVDAdapter() if task_input.model == "svd" else RunwayAdapter()

    try:
        result = await adapter.generate(task_input)
        return {"output": {"url": result.url, "metadata": result.metadata}, "meta": {"model": task_input.model}}
    except Exception as e:
        logger.error("video generation failed: %s", e)
        raise