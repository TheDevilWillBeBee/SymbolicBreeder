"""Provider registry and factory."""

from .base import LLMProvider
from .anthropic_provider import AnthropicProvider
from .openai_provider import OpenAIProvider

PROVIDER_REGISTRY: dict[str, type[LLMProvider]] = {
    "anthropic": AnthropicProvider,
    "openai": OpenAIProvider,
}

PROVIDER_MODELS: dict[str, list[str]] = {
    "anthropic": AnthropicProvider.supported_models(),
    "openai": OpenAIProvider.supported_models(),
}

PROVIDER_LABELS: dict[str, str] = {
    "anthropic": "Anthropic",
    "openai": "OpenAI",
}


def get_provider(
    provider_key: str, model: str, base_url: str | None = None
) -> LLMProvider:
    cls = PROVIDER_REGISTRY.get(provider_key)
    if cls is None:
        raise ValueError(f"Unknown provider: {provider_key}")
    return cls(model=model, base_url=base_url)
