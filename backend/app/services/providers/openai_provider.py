"""OpenAI and OpenAI-compatible provider (Groq, Mistral, Together, etc.)."""

from .base import LLMProvider, LLMRequest, LLMResponse


class OpenAIProvider(LLMProvider):
    def __init__(self, model: str, base_url: str | None = None, **kwargs):
        self.model = model
        self.base_url = base_url

    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key, base_url=self.base_url)
        response = await client.chat.completions.create(
            model=self.model,
            max_tokens=request.max_tokens,
            messages=[
                {"role": "system", "content": request.system},
                {"role": "user", "content": (request.user_context + "\n\n" + request.user) if request.user_context else request.user},
            ],
        )
        return LLMResponse(text=response.choices[0].message.content)

    @classmethod
    def supported_models(cls) -> list[str]:
        return [
            "gpt-4o",
            "gpt-4o-mini",
            "o3-mini",
        ]
