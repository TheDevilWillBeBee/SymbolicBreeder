"""Anthropic Claude provider."""

from .base import LLMProvider, LLMRequest, LLMResponse


class AnthropicProvider(LLMProvider):
    def __init__(self, model: str, **kwargs):
        self.model = model

    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=api_key)

        # Build user content blocks — cache the static context separately
        user_content = []
        if request.user_context:
            user_content.append(
                {
                    "type": "text",
                    "text": request.user_context,
                    "cache_control": {"type": "ephemeral"},
                }
            )
        user_content.append({"type": "text", "text": request.user})

        response = await client.messages.create(
            model=self.model,
            max_tokens=request.max_tokens,
            system=[
                {
                    "type": "text",
                    "text": request.system,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_content}],
        )
        return LLMResponse(text=response.content[0].text)

    @classmethod
    def supported_models(cls) -> list[str]:
        return [
            "claude-sonnet-4-20250514",
            "claude-opus-4-5",
            "claude-haiku-4-5-20251001",
        ]
