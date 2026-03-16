"""Anthropic Claude provider."""

from .base import LLMProvider, LLMRequest, LLMResponse


class AnthropicProvider(LLMProvider):
    def __init__(self, model: str, **kwargs):
        self.model = model

    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=api_key, timeout=180.0)
        response = await client.messages.create(
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
        return LLMResponse(text=response.content[0].text)

    @classmethod
    def supported_models(cls) -> list[str]:
        return [
            "claude-sonnet-4-20250514",
            "claude-opus-4-5",
            "claude-haiku-4-5-20251001",
        ]
