"""Anthropic Claude provider."""

from collections.abc import AsyncIterator

from .base import LLMProvider, LLMRequest, LLMResponse


class AnthropicProvider(LLMProvider):
    def __init__(self, model: str, **kwargs):
        self.model = model

    def _build_kwargs(self, request: LLMRequest):
        return dict(
            model=self.model,
            max_tokens=request.max_tokens,
            system=[
                {
                    "type": "text",
                    "text": request.system,
                    "cache_control": {"type": "ephemeral", "ttl": "1h"},
                }
            ],
            messages=[{"role": "user", "content": request.user}],
            extra_headers={"anthropic-beta": "extended-cache-ttl-2025-04-11"},
        )

    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=api_key, timeout=180.0)
        response = await client.messages.create(**self._build_kwargs(request))
        return LLMResponse(text=response.content[0].text)

    async def stream_complete(self, request: LLMRequest, api_key: str) -> AsyncIterator[str]:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=api_key, timeout=180.0)
        async with client.messages.stream(**self._build_kwargs(request)) as stream:
            async for text in stream.text_stream:
                yield text

    @classmethod
    def supported_models(cls) -> list[str]:
        return [
            "claude-sonnet-4-20250514",
            "claude-opus-4-5",
            "claude-haiku-4-5-20251001",
        ]
