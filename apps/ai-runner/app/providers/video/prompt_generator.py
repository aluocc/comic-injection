# apps/ai-runner/app/providers/video/prompt_generator.py
import httpx
from typing import Any


class PromptGeneratorError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


class ShotPromptGenerator:
    """基于剧本内容生成分镜视频提示词"""

    SYSTEM_PROMPT = """你是一位专业的影视分镜导演。根据提供的剧本场景内容、人物信息和场景描述，为每个镜头生成适合视频生成模型的详细英文提示词。

要求：
1. 提示词需包含：镜头类型、画面内容、人物动作、环境氛围、光影风格
2. 使用英文输出，逗号分隔的详细描述
3. 每个镜头提示词控制在 200-500 个字符
4. 风格统一为 cinematic, high quality, professional film
5. 避免版权敏感内容

镜头类型映射：
- wide: wide shot, establishing shot
- medium: medium shot, waist up
- closeup: close-up shot, face detail
- extreme_closeup: extreme close-up, eye/detail
- over_shoulder: over the shoulder shot
- aerial: aerial shot, bird's eye view
"""

    async def generate(
        self,
        scene_content: str,
        characters: list[dict[str, Any]],
        scene_info: dict[str, Any],
        api_key: str,
    ) -> list[dict[str, str]]:
        """生成分镜提示词列表"""
        character_desc = "\n".join(
            f"- {c.get('name', '')}: {c.get('description', '')}" for c in characters
        )
        location = scene_info.get("location", "")
        time = scene_info.get("time", "")

        user_prompt = f"""场景内容：
{scene_content}

人物信息：
{character_desc}

场景地点：{location}
场景时间：{time}

请为上述场景生成 3-5 个镜头的视频生成提示词。每个镜头包含 type 和 prompt 字段。"""

        body = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "shots",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "shots": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "type": {"type": "string", "enum": ["wide", "medium", "closeup", "extreme_closeup", "over_shoulder", "aerial"]},
                                        "prompt": {"type": "string"},
                                        "description": {"type": "string"},
                                    },
                                    "required": ["type", "prompt"],
                                },
                            },
                        },
                        "required": ["shots"],
                    },
                },
            },
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    json=body,
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as e:
            raise PromptGeneratorError("PROVIDER_ERROR", str(e))
        except httpx.HTTPError as e:
            raise PromptGeneratorError("NETWORK", str(e))

        content = data["choices"][0]["message"]["content"]
        import json
        parsed = json.loads(content)
        return parsed.get("shots", [])