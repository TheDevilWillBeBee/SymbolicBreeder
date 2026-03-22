"""LLM integration for generating programs across modalities."""

import json
import logging
import re
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Optional

from .mock_data import _mock_generate

from ..config import get_server_api_key
from .context import get_system_context, get_prompt_config
from .providers import get_provider, LLMRequest

logger = logging.getLogger(__name__)


@dataclass
class GenerationResult:
    """Result of program generation with source metadata."""
    codes: list[str]
    source: str  # "llm" or "mock"
    message: str | None = None


# Fence type per modality (for code block extraction)
_MODALITY_FENCES: dict[str, str] = {
    "strudel": "strudel",
    "shader": "glsl",
    "openscad": "openscad",
    "svg": "svg",
}


async def generate_programs(
    modality: str,
    parent_codes: list[str],
    population_size: int = 6,
    guidance: Optional[str] = None,
    provider_key: str = "anthropic",
    model: str = "claude-sonnet-4-20250514",
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    context_profile: str = "intermediate",
) -> GenerationResult:
    """Generate new programs for the given modality. Uses LLM if API key is available, else mock."""
    if not api_key:
        # Fall back to a server-side key if the frontend didn't supply one.
        api_key = get_server_api_key()
    if api_key:
        logger.info(
            "Using LLM (%s/%s) to generate %d %s programs (profile=%s)",
            provider_key,
            model,
            population_size,
            modality,
            context_profile,
        )
        try:
            codes = await _llm_generate(
                modality,
                parent_codes,
                population_size,
                guidance,
                provider_key,
                model,
                api_key,
                base_url,
                context_profile,
            )
            return GenerationResult(codes=codes, source="llm")
        except Exception as exc:
            logger.warning("LLM call failed (%s), falling back to mock: %s", type(exc).__name__, exc)
            codes = _mock_generate(modality, parent_codes, population_size)
            return GenerationResult(
                codes=codes,
                source="mock",
                message=f"LLM error: {exc} — used mock examples instead",
            )
    logger.info("No API key available — using mock generation for %s", modality)
    codes = _mock_generate(modality, parent_codes, population_size)
    return GenerationResult(
        codes=codes,
        source="mock",
        message="No API key available — used mock examples",
    )


def _build_system_prompt(modality: str, context_profile: str) -> str:
    """Build the full system prompt by combining role from prompt bundle with profile context."""
    config = get_prompt_config(modality)
    role = config.get("role", "")
    system_context = get_system_context(modality, profile=context_profile)
    if system_context:
        return role + "\n\n" + system_context
    return role


async def _llm_generate(
    modality: str,
    parent_codes: list[str],
    population_size: int,
    guidance: Optional[str],
    provider_key: str,
    model: str,
    api_key: str,
    base_url: Optional[str],
    context_profile: str,
) -> list[str]:
    provider = get_provider(provider_key, model, base_url)
    config = get_prompt_config(modality)
    system_prompt = _build_system_prompt(modality, context_profile)
    fence = _MODALITY_FENCES.get(modality, "")

    if parent_codes:
        # ── Evolution mode ──
        parent_section = "\n\n".join(
            f"Parent {i + 1}:\n```{fence}\n{code}\n```"
            for i, code in enumerate(parent_codes)
        )

        prompt = (
            f"Here are the parent programs the user selected:\n\n"
            f"{parent_section}\n\n"
            + config.get("evolve_prompt", "").format(n=population_size)
        )
    else:
        # ── Seed mode ──
        prompt = config.get("seed_prompt", "").format(n=population_size)

    if guidance:
        prompt += f'\n\nThe user requested: "{guidance}"'

    variety = config.get("variety_suffix", "")
    if variety:
        prompt += "\n\n" + variety.format(n=population_size)

    logger.info(
        "Sending LLM request (provider=%s, model=%s, modality=%s, profile=%s, system=%d chars, user=%d chars)",
        provider_key,
        model,
        modality,
        context_profile,
        len(system_prompt),
        len(prompt),
    )

    llm_request = LLMRequest(system=system_prompt, user=prompt)
    response = await provider.complete(llm_request, api_key)

    return _parse_code_blocks(response.text, fence, population_size, modality)


def _parse_code_blocks(
    text: str, fence: str, expected: int, modality: str
) -> list[str]:
    """Extract code blocks from LLM response."""
    # Match both specific fence and generic code blocks
    pattern = rf"```(?:{fence})?\s*\n(.*?)```"
    blocks = re.findall(pattern, text, re.DOTALL)
    blocks = [b.strip() for b in blocks if b.strip()]
    if not blocks:
        return _mock_generate(modality, [], expected)
    return blocks[:expected]


def _sse_event(event: str, data: dict | str) -> str:
    """Format a single SSE event."""
    payload = json.dumps(data) if isinstance(data, dict) else data
    return f"event: {event}\ndata: {payload}\n\n"


async def generate_programs_stream(
    modality: str,
    parent_codes: list[str],
    population_size: int = 6,
    guidance: Optional[str] = None,
    provider_key: str = "anthropic",
    model: str = "claude-sonnet-4-20250514",
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    context_profile: str = "intermediate",
) -> AsyncIterator[str]:
    """Stream LLM generation as SSE events: token, done, error, or mock."""
    if not api_key:
        api_key = get_server_api_key()

    if not api_key:
        codes = _mock_generate(modality, parent_codes, population_size)
        yield _sse_event("mock", {"codes": codes, "source": "mock", "message": "No API key available — used mock examples"})
        return

    try:
        yield _sse_event("status", {"phase": "connecting"})
        provider = get_provider(provider_key, model, base_url)
        config = get_prompt_config(modality)
        system_prompt = _build_system_prompt(modality, context_profile)
        fence = _MODALITY_FENCES.get(modality, "")

        if parent_codes:
            parent_section = "\n\n".join(
                f"Parent {i + 1}:\n```{fence}\n{code}\n```"
                for i, code in enumerate(parent_codes)
            )
            prompt = (
                f"Here are the parent programs the user selected:\n\n"
                f"{parent_section}\n\n"
                + config.get("evolve_prompt", "").format(n=population_size)
            )
        else:
            prompt = config.get("seed_prompt", "").format(n=population_size)

        if guidance:
            prompt += f'\n\nThe user requested: "{guidance}"'

        variety = config.get("variety_suffix", "")
        if variety:
            prompt += "\n\n" + variety.format(n=population_size)

        yield _sse_event("status", {"phase": "sending"})
        llm_request = LLMRequest(system=system_prompt, user=prompt)
        accumulated = ""
        first_token = True

        async for delta in provider.stream_complete(llm_request, api_key):
            if first_token:
                yield _sse_event("status", {"phase": "generating"})
                first_token = False
            accumulated += delta
            yield _sse_event("token", {"text": delta})

        codes = _parse_code_blocks(accumulated, fence, population_size, modality)
        yield _sse_event("done", {"codes": codes, "source": "llm"})

    except Exception as exc:
        logger.warning("LLM stream failed (%s), falling back to mock: %s", type(exc).__name__, exc)
        codes = _mock_generate(modality, parent_codes, population_size)
        yield _sse_event("error", {
            "codes": codes,
            "source": "mock",
            "message": f"LLM error: {exc} — used mock examples instead",
        })

