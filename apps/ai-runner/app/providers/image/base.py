# apps/ai-runner/app/providers/image/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ImageTaskInput:
    """图像生成任务输入"""
    prompt: str
    negative_prompt: str = ""
    width: int = 512
    height: int = 512
    style: str = ""
    model: str = "sd"
    user_api_key: str = ""


@dataclass
class ImageTaskResult:
    """图像生成任务结果"""
    url: str
    metadata: dict[str, Any] = field(default_factory=dict)


class ImageProviderAdapter(ABC):
    """图像提供商适配器基类"""
    name: str = ""

    @abstractmethod
    async def generate(self, task: ImageTaskInput) -> ImageTaskResult:
        """生成图像"""
        ...


class ImageProviderError(Exception):
    """图像提供商错误"""
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)