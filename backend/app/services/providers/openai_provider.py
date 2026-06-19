"""OpenAI and OpenAI-compatible provider (Groq, Mistral, Together, etc.)."""

from collections.abc import AsyncIterator

from .base import LLMProvider, LLMRequest, LLMResponse


def _is_reasoning_style_model(model: str) -> bool:
    """Models that bill reasoning + completion against the same output limit."""
    m = model.lower()
    return m.startswith("gpt-5") or m.startswith(("o1", "o3", "o4"))


def _completion_limit_kwargs(model: str, max_tokens: int) -> dict:
    """
    GPT-5 / o-series require ``max_completion_tokens`` (not ``max_tokens``).

    Reasoning models consume much of the output budget before visible text. The default
    LLMRequest max (4096) often yields empty ``message.content`` — OpenAI recommends a
    much larger budget when experimenting (e.g. 25k+ for reasoning + answer).
    """
    m = model.lower()
    if _is_reasoning_style_model(m):
        # Floor so short prompts still leave room for reasoning + code fences.
        n = max(int(max_tokens), 32_768)
        n = min(n, 128_000)
        return {"max_completion_tokens": n}
    return {"max_tokens": max_tokens}


def _reasoning_extra_body(model: str) -> dict | None:
    """Optional API extensions for GPT-5 chat completions (forwarded verbatim)."""
    if not model.lower().startswith("gpt-5"):
        return None
    return {"reasoning": {"effort": "low"}}


def _message_text(response) -> str:
    """Extract assistant text; raise with context if the model returned nothing useful."""
    if not response.choices:
        raise RuntimeError("OpenAI returned no choices")
    choice = response.choices[0]
    msg = choice.message
    text = (msg.content or "").strip() if msg and msg.content else ""
    if text:
        return text
    refusal = getattr(msg, "refusal", None) if msg else None
    if refusal:
        raise RuntimeError(f"OpenAI refusal: {refusal}")
    fr = getattr(choice, "finish_reason", None)
    raise RuntimeError(
        "OpenAI returned empty message.content "
        f"(finish_reason={fr!r}; for GPT-5/o-series try a larger max_completion_tokens "
        "or check model availability)"
    )


def _stream_delta_text(delta) -> str:
    if delta is None:
        return ""
    t = getattr(delta, "content", None)
    return t if isinstance(t, str) and t else ""


class OpenAIProvider(LLMProvider):
    def __init__(self, model: str, base_url: str | None = None, **kwargs):
        self.model = model
        self.base_url = base_url

    def _build_messages(self, request: LLMRequest):
        return [
            {"role": "system", "content": request.system},
            {"role": "user", "content": request.user},
        ]

    def _chat_create_kwargs(self, request: LLMRequest, stream: bool) -> dict:
        kwargs: dict = {
            "model": self.model,
            "messages": self._build_messages(request),
            **_completion_limit_kwargs(self.model, request.max_tokens),
        }
        if stream:
            kwargs["stream"] = True
        extra = _reasoning_extra_body(self.model)
        if extra:
            # Supported by recent OpenAI Python SDKs; forwarded to the API as JSON.
            kwargs["extra_body"] = extra
        return kwargs

    async def _chat_completions_create(self, client, request: LLMRequest, stream: bool):
        from openai import BadRequestError

        kwargs = self._chat_create_kwargs(request, stream)
        try:
            return await client.chat.completions.create(**kwargs)
        except TypeError:
            # Older openai-python without ``extra_body``
            kwargs.pop("extra_body", None)
            return await client.chat.completions.create(**kwargs)
        except BadRequestError:
            # Some accounts/API versions reject ``reasoning`` in ``extra_body``; retry without.
            if "extra_body" not in kwargs:
                raise
            kwargs.pop("extra_body", None)
            return await client.chat.completions.create(**kwargs)

    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key, base_url=self.base_url, timeout=180.0)
        response = await self._chat_completions_create(client, request, stream=False)
        return LLMResponse(text=_message_text(response))

    async def stream_complete(self, request: LLMRequest, api_key: str) -> AsyncIterator[str]:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key, base_url=self.base_url, timeout=180.0)
        stream = await self._chat_completions_create(client, request, stream=True)
        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            piece = _stream_delta_text(delta)
            if piece:
                yield piece

    @classmethod
    def supported_models(cls) -> list[str]:
        return [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-5",
            "gpt-5-nano",
            "o3-mini",
        ]
