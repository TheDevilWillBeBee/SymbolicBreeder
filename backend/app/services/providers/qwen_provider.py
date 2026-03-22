"""Qwen provider via Alibaba Dashscope (OpenAI-compatible with explicit caching)."""

from collections.abc import AsyncIterator

from .base import LLMProvider, LLMRequest, LLMResponse


class QwenProvider(LLMProvider):
    BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

    def __init__(self, model: str, **kwargs):
        self.model = model

    def _build_messages(self, request: LLMRequest):
        return [
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
        ]

    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key, base_url=self.BASE_URL, timeout=180.0)
        response = await client.chat.completions.create(
            model=self.model,
            max_tokens=request.max_tokens,
            messages=self._build_messages(request),
        )
        return LLMResponse(text=response.choices[0].message.content)

    async def stream_complete(self, request: LLMRequest, api_key: str) -> AsyncIterator[str]:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key, base_url=self.BASE_URL, timeout=180.0)
        stream = await client.chat.completions.create(
            model=self.model,
            max_tokens=request.max_tokens,
            messages=self._build_messages(request),
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield delta

    @classmethod
    def supported_models(cls) -> list[str]:
        return [
            "qwen3.5-plus",
            "qwen3-max",
            "qwen3.5-flash",
        ]
