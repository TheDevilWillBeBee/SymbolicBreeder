"""Qwen provider via Alibaba Dashscope (OpenAI-compatible with explicit caching)."""

from .base import LLMProvider, LLMRequest, LLMResponse


class QwenProvider(LLMProvider):
    BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

    def __init__(self, model: str, **kwargs):
        self.model = model

    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key, base_url=self.BASE_URL)
        response = await client.chat.completions.create(
            model=self.model,
            max_tokens=request.max_tokens,
            messages=[
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "text",
                            "text": request.system,
                            "cache_control": {"type": "ephemeral"},
                        }
                    ],
                },
                {"role": "user", "content": request.user},
            ],
        )
        return LLMResponse(text=response.choices[0].message.content)

    @classmethod
    def supported_models(cls) -> list[str]:
        return [
            "qwen3.5-plus",
            "qwen3-max",
            "qwen3.5-flash",
        ]
