"""Google Gemini provider."""

from collections.abc import AsyncIterator

from .base import LLMProvider, LLMRequest, LLMResponse


class GeminiProvider(LLMProvider):
    def __init__(self, model: str, **kwargs):
        self.model = model

    def _build_config(self, request: LLMRequest):
        from google.genai import types
        return types.GenerateContentConfig(
            system_instruction=request.system,
            max_output_tokens=request.max_tokens,
        )

    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=180_000))
        response = await client.aio.models.generate_content(
            model=self.model,
            contents=request.user,
            config=self._build_config(request),
        )
        return LLMResponse(text=response.text)

    async def stream_complete(self, request: LLMRequest, api_key: str) -> AsyncIterator[str]:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=180_000))
        async for chunk in client.aio.models.generate_content_stream(
            model=self.model,
            contents=request.user,
            config=self._build_config(request),
        ):
            if chunk.text:
                yield chunk.text

    @classmethod
    def supported_models(cls) -> list[str]:
        return [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
        ]
