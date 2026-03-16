"""Provider registry and factory."""

from .base import LLMProvider
from .anthropic_provider import AnthropicProvider
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider
from .qwen_provider import QwenProvider

PROVIDER_REGISTRY: dict[str, type[LLMProvider]] = {
    "anthropic": AnthropicProvider,
    "openai": OpenAIProvider,
    "gemini": GeminiProvider,
    "qwen": QwenProvider,
}

PROVIDER_MODELS: dict[str, list[str]] = {
    "anthropic": AnthropicProvider.supported_models(),
    "openai": OpenAIProvider.supported_models(),
    "gemini": GeminiProvider.supported_models(),
    "qwen": QwenProvider.supported_models(),
}

PROVIDER_LABELS: dict[str, str] = {
    "anthropic": "Anthropic",
    "openai": "OpenAI",
    "gemini": "Google Gemini",
    "qwen": "Qwen",
}


def get_provider(
    provider_key: str, model: str, base_url: str | None = None
) -> LLMProvider:
    cls = PROVIDER_REGISTRY.get(provider_key)
    if cls is None:
        raise ValueError(f"Unknown provider: {provider_key}")
    return cls(model=model, base_url=base_url)
