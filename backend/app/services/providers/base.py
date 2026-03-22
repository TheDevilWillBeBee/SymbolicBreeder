"""Abstract base class for LLM providers."""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass


@dataclass
class LLMRequest:
    system: str
    user: str
    max_tokens: int = 4096


@dataclass
class LLMResponse:
    text: str


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        """Send a completion request and return the raw text response."""
        ...

    async def stream_complete(self, request: LLMRequest, api_key: str) -> AsyncIterator[str]:
        """Stream text deltas. Default falls back to complete()."""
        response = await self.complete(request, api_key)
        yield response.text

    @classmethod
    @abstractmethod
    def supported_models(cls) -> list[str]:
        """Return the list of model identifiers this provider supports."""
        ...
