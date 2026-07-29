# apps/ai-runner/app/providers/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

@dataclass
class TaskInput:
    kind: str            # text|image|video
    params: dict[str, Any]
    user_api_key: str

@dataclass
class TaskResult:
    output: Any         # str (text) or dict (url/manifest)
    meta: dict[str, Any]

class ProviderAdapter(ABC):
    name: str = ""

    @abstractmethod
    async def execute(self, task: TaskInput) -> TaskResult:
        ...

class ProviderError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)
