# apps/ai-runner/app/providers/registry.py
from app.providers.base import ProviderAdapter

_REGISTRY: dict[str, ProviderAdapter] = {}

def register(adapter: ProviderAdapter) -> None:
    _REGISTRY[adapter.name] = adapter

def get(name: str) -> ProviderAdapter:
    if name not in _REGISTRY:
        raise KeyError(f"provider '{name}' not registered")
    return _REGISTRY[name]

def available() -> list[str]:
    return list(_REGISTRY.keys())
