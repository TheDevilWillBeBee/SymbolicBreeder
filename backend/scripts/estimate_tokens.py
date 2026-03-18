#!/usr/bin/env python3
"""Estimate token counts for each modality × profile combination.

Usage:
    python backend/scripts/estimate_tokens.py
    # or from backend/:
    python scripts/estimate_tokens.py
"""

import sys
from pathlib import Path

# Add backend to path so we can import app modules
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.services.context import (
    get_system_context,
    get_prompt_config,
    get_context_version,
    list_modalities,
    reload,
)

PROFILES = ["simple", "intermediate", "advanced"]


def estimate_tokens(text: str) -> int:
    """Rough token estimate: ~4 chars per token for English/code."""
    return len(text) // 4


def main() -> None:
    reload()  # ensure fresh load
    modalities = list_modalities()

    if not modalities:
        print("No modalities found. Check that backend/context/ has valid manifest.yaml files.")
        return

    print("=" * 80)
    print("Context Token Estimation Report")
    print("=" * 80)

    for modality in modalities:
        version = get_context_version(modality)
        config = get_prompt_config(modality)

        print(f"\n{'─' * 80}")
        print(f"Modality: {modality}  (context version: {version})")
        print(f"{'─' * 80}")

        # Prompt tokens (fixed across profiles)
        role_text = config.get("role", "")
        seed_text = config.get("seed_prompt", "").format(n=6)
        evolve_text = config.get("evolve_prompt", "").format(n=6)
        variety_text = config.get("variety_suffix", "").format(n=6)

        print(f"\n  Prompt bundle (fixed across profiles):")
        print(f"    Role:           {estimate_tokens(role_text):>6} tokens  ({len(role_text):>6} chars)")
        print(f"    Seed prompt:    {estimate_tokens(seed_text):>6} tokens  ({len(seed_text):>6} chars)")
        print(f"    Evolve prompt:  {estimate_tokens(evolve_text):>6} tokens  ({len(evolve_text):>6} chars)")
        print(f"    Variety suffix: {estimate_tokens(variety_text):>6} tokens  ({len(variety_text):>6} chars)")

        print(f"\n  System context by profile:")
        for profile in PROFILES:
            ctx = get_system_context(modality, profile=profile)
            ctx_tokens = estimate_tokens(ctx)
            total_system = role_text + "\n\n" + ctx
            total_tokens = estimate_tokens(total_system)
            print(f"    {profile:<15} {ctx_tokens:>6} tokens  ({len(ctx):>6} chars)  |  total system prompt: {total_tokens:>6} tokens")

        print(f"\n  Full request estimate (system + user):")
        for profile in PROFILES:
            ctx = get_system_context(modality, profile=profile)
            system = role_text + "\n\n" + ctx
            # Seed request
            seed_user = seed_text + "\n\n" + variety_text
            seed_total = estimate_tokens(system) + estimate_tokens(seed_user)
            # Evolve request (with ~3 parents, rough estimate)
            evolve_user = evolve_text + "\n\n" + variety_text
            evolve_total = estimate_tokens(system) + estimate_tokens(evolve_user)
            print(f"    {profile:<15} seed: ~{seed_total:>6} tokens  |  evolve: ~{evolve_total:>6} tokens (excl. parent code)")

    print(f"\n{'=' * 80}")
    print("Note: Token counts are rough estimates (~4 chars/token). Actual counts vary by tokenizer.")
    print("=" * 80)


if __name__ == "__main__":
    main()
