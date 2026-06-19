"""Sandbox generation core.

Reuses the existing prompt-assembly + provider invocation from
``app.services.llm`` to produce one program at a time. **Does not write to the
main Postgres tables** — the caller (job manager or quick-test router) is
responsible for inserting rows into the sandbox SQLite database.
"""

from __future__ import annotations

import logging
import random
import time
from dataclasses import dataclass
from typing import Any, Optional

from ...config import get_server_api_key
from ...services.context import get_prompt_config
from ...services.llm import (
    _MODALITY_FENCES,
    _build_system_prompt,
    _build_user_prompt,
    _flatten_prompt,
    _parse_code_blocks,
)
from ...services.mock_data import _mock_generate
from ...services.providers import LLMRequest, get_provider

logger = logging.getLogger(__name__)


@dataclass
class SampleSpec:
    """The fully-resolved instructions for generating one sample."""

    modality: str
    context_version: Optional[str]  # None or "default" => app default
    context_profile: str
    mode: str  # "seed" | "evolve"
    use_guidance: bool
    use_parents: bool
    parents: list[dict[str, Any]]  # [{id?, code, label?}]
    guidance: Optional[str]
    provider: str
    model: str
    base_url: Optional[str]
    api_key: Optional[str]


@dataclass
class GeneratedSample:
    code: str
    prompt_flat: str
    source: str  # "llm" | "mock"
    error: Optional[str]
    latency_ms: int


def normalize_version(version: Optional[str]) -> Optional[str]:
    """Sandbox uses 'default' (or None) for the app default; pass through 'vN' tokens."""
    if version is None or version == "default" or version == "":
        return None
    return version


def pick_random(items: list[Any], rng: random.Random | None = None) -> Any:
    rng = rng or random
    if not items:
        return None
    return rng.choice(items)


def build_spec(
    *,
    modality: str,
    context_version: Optional[str],
    context_profile: str,
    mode: str,
    use_guidance: bool,
    use_parents: bool,
    parents_per_sample: int,
    prompt_pool: list[str],
    parent_pool: list[dict[str, Any]],
    provider: str,
    model: str,
    base_url: Optional[str],
    api_key: Optional[str],
    rng: random.Random | None = None,
) -> SampleSpec:
    rng = rng or random.Random()
    parents: list[dict[str, Any]] = []
    if use_parents and parent_pool and parents_per_sample > 0:
        # Sample without replacement when possible
        if len(parent_pool) >= parents_per_sample:
            parents = rng.sample(parent_pool, parents_per_sample)
        else:
            parents = [rng.choice(parent_pool) for _ in range(parents_per_sample)]

    guidance: Optional[str] = None
    if use_guidance and prompt_pool:
        guidance = rng.choice(prompt_pool)

    return SampleSpec(
        modality=modality,
        context_version=normalize_version(context_version),
        context_profile=context_profile,
        mode=mode,
        use_guidance=use_guidance,
        use_parents=use_parents,
        parents=parents,
        guidance=guidance,
        provider=provider,
        model=model,
        base_url=base_url,
        api_key=api_key,
    )


async def generate_one(spec: SampleSpec) -> GeneratedSample:
    """Run the LLM once and return the first code block.

    On any failure, falls back to mock generation (same behavior as
    ``app.services.llm.generate_programs``) so the sample is still recorded.
    """
    parent_codes = [p.get("code", "") for p in spec.parents] if spec.use_parents else []
    context_key = (
        f"{spec.modality}@{spec.context_version}" if spec.context_version else spec.modality
    )

    population_size = 1  # Sandbox: one code per LLM call so we can checkpoint cleanly

    config = get_prompt_config(context_key)
    system_prompt = _build_system_prompt(
        spec.modality, spec.context_profile, spec.context_version
    )
    user_prompt = _build_user_prompt(
        spec.modality, parent_codes, population_size, spec.guidance, config
    )
    prompt_flat = _flatten_prompt(system_prompt, user_prompt)
    fence = _MODALITY_FENCES.get(spec.modality, "")

    api_key = spec.api_key or get_server_api_key()

    started = time.perf_counter()
    if not api_key:
        codes = _mock_generate(spec.modality, parent_codes, population_size)
        latency_ms = int((time.perf_counter() - started) * 1000)
        return GeneratedSample(
            code=codes[0] if codes else "",
            prompt_flat=prompt_flat,
            source="mock",
            error=None,
            latency_ms=latency_ms,
        )

    try:
        provider = get_provider(spec.provider, spec.model, spec.base_url)
        request = LLMRequest(system=system_prompt, user=user_prompt)
        response = await provider.complete(request, api_key)
        codes = _parse_code_blocks(response.text, fence, population_size, spec.modality)
        latency_ms = int((time.perf_counter() - started) * 1000)
        return GeneratedSample(
            code=codes[0] if codes else "",
            prompt_flat=prompt_flat,
            source="llm",
            error=None,
            latency_ms=latency_ms,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Sandbox LLM call failed (%s): %s", type(exc).__name__, exc)
        codes = _mock_generate(spec.modality, parent_codes, population_size)
        latency_ms = int((time.perf_counter() - started) * 1000)
        return GeneratedSample(
            code=codes[0] if codes else "",
            prompt_flat=prompt_flat,
            source="mock",
            error=f"{type(exc).__name__}: {exc}",
            latency_ms=latency_ms,
        )
