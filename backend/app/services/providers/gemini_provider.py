"""Google Gemini provider."""

from .base import LLMProvider, LLMRequest, LLMResponse


class GeminiProvider(LLMProvider):
    def __init__(self, model: str, **kwargs):
        self.model = model

    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        response = await client.aio.models.generate_content(
            model=self.model,
            contents=(request.user_context + "\n\n" + request.user) if request.user_context else request.user,
            config=types.GenerateContentConfig(
                system_instruction=request.system,
                max_output_tokens=request.max_tokens,
            ),
        )
        return LLMResponse(text=response.text)

    @classmethod
    def supported_models(cls) -> list[str]:
        return [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
        ]
