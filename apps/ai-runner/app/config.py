# apps/ai-runner/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    api_gateway_url: str = "http://localhost:3000"
    internal_secret: str = "dev-internal"
    model_config = {"env_prefix": "AI_"}

settings = Settings()