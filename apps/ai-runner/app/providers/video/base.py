# apps/ai-runner/app/providers/video/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class VideoTaskInput:
    """视频生成任务输入"""
    prompt: str
    negative_prompt: str = ""
    duration: int = 4
    model: str = "svd"
    user_api_key: str = ""
    reference_image_url: str = ""


@dataclass
class VideoTaskResult:
    """视频生成任务结果"""
    url: str
    metadata: dict[str, Any] = field(default_factory=dict)


class VideoProviderAdapter(ABC):
    """视频提供商适配器基类"""
    name: str = ""

    @abstractmethod
    async def generate(self, task: VideoTaskInput) -> VideoTaskResult:
        """生成视频"""
        ...


class VideoProviderError(Exception):
    """视频提供商错误"""
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)