"""OpenAI and OpenAI-compatible provider (Groq, Mistral, Together, etc.)."""

from collections.abc import AsyncIterator

from .base import LLMProvider, LLMRequest, LLMResponse


class OpenAIProvider(LLMProvider):
    def __init__(self, model: str, base_url: str | None = None, **kwargs):
        self.model = model
        self.base_url = base_url

    def _build_messages(self, request: LLMRequest):
        return [
            {"role": "system", "content": request.system},
            {"role": "user", "content": request.user},
        ]

    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key, base_url=self.base_url, timeout=180.0)
        response = await client.chat.completions.create(
            model=self.model,
            max_tokens=request.max_tokens,
            messages=self._build_messages(request),
        )
        return LLMResponse(text=response.choices[0].message.content)

    async def stream_complete(self, request: LLMRequest, api_key: str) -> AsyncIterator[str]:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key, base_url=self.base_url, timeout=180.0)
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
            "gpt-4o",
            "gpt-4o-mini",
            "o3-mini",
        ]
