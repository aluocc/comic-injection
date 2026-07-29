# apps/ai-runner/app/main.py
from fastapi import FastAPI
from app.providers import registry
from app.providers.text.openai_adapter import register_openai
from app.providers.text.completion_adapter import register_completion
from app.providers.text.script_adapter import register_script

register_openai()
register_completion()
register_script()
app = FastAPI(title="AI Runner")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-runner", "providers": registry.available()}
