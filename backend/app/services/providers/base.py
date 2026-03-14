"""Abstract base class for LLM providers."""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class LLMRequest:
    system: str
    user: str
    max_tokens: int = 4096
    user_context: str = ""  # static context prepended to user message; cacheable


@dataclass
class LLMResponse:
    text: str


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, request: LLMRequest, api_key: str) -> LLMResponse:
        """Send a completion request and return the raw text response."""
        ...

    @classmethod
    @abstractmethod
    def supported_models(cls) -> list[str]:
        """Return the list of model identifiers this provider supports."""
        ...
