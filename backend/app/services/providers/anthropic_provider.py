"""Anthropic Claude provider."""

from .base import LLMProvider, LLMRequest, LLMResponse


class AnthropicProvider(LLMProvider):
    def __init__(self, model: str, **kwargs):
        self.model = model

    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=api_key)
        response = await client.messages.create(
            model=self.model,
            max_tokens=request.max_tokens,
            system=request.system,
            messages=[{"role": "user", "content": request.user}],
        )
        return LLMResponse(text=response.content[0].text)

    @classmethod
    def supported_models(cls) -> list[str]:
        return [
            "claude-sonnet-4-20250514",
            "claude-opus-4-5",
            "claude-haiku-4-5-20251001",
        ]
