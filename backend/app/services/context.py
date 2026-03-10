"""Context loader — reads per-modality reference & example data from backend/context/.

Each modality has its own subfolder under backend/context/ with a manifest.yaml
that controls which sources are loaded and when they are injected into LLM prompts.

Usage::

    from app.services.context import get_system_context, get_seed_context, get_evolve_context

    system_prompt = BASE_SYSTEM + "\\n\\n" + get_system_context("strudel")
    seed_context  = get_seed_context("shader")
    evolve_context = get_evolve_context("strudel")

Adding a new modality:
    1. Create backend/context/<modality_key>/manifest.yaml
    2. Populate tutorial/example .md files
    3. No Python changes required — auto-discovered by folder name.
"""

import logging
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger(__name__)

# Resolve the context root directory (backend/context/)
_CONTEXT_ROOT = Path(__file__).resolve().parent.parent.parent / "context"

# ── Internal caches (per modality) ──
_manifests: dict[str, list[dict[str, Any]]] = {}
_file_cache: dict[str, str] = {}


def _load_manifest(modality: str) -> list[dict[str, Any]]:
    """Load and cache the manifest file for a given modality."""
    if modality in _manifests:
        return _manifests[modality]

    manifest_path = _CONTEXT_ROOT / modality / "manifest.yaml"
    if not manifest_path.exists():
        logger.warning("Context manifest not found at %s", manifest_path)
        _manifests[modality] = []
        return _manifests[modality]

    with open(manifest_path) as f:
        data = yaml.safe_load(f)

    sources = data.get("sources", []) if data else []
    _manifests[modality] = sources
    logger.info(
        "Loaded context manifest for '%s' with %d sources", modality, len(sources)
    )
    return sources


def _read_source(modality: str, source: dict[str, Any]) -> str:
    """Read and cache a single source file."""
    rel_path = source["path"]
    cache_key = f"{modality}/{rel_path}"
    if cache_key in _file_cache:
        return _file_cache[cache_key]

    full_path = _CONTEXT_ROOT / modality / rel_path
    if not full_path.exists():
        logger.warning("Context source file missing: %s", full_path)
        return ""

    text = full_path.read_text(encoding="utf-8")
    _file_cache[cache_key] = text
    return text


def _gather(modality: str, inject_key: str) -> str:
    """Gather all enabled sources matching *inject_key* into a single string."""
    manifest = _load_manifest(modality)
    parts: list[str] = []

    for source in manifest:
        if not source.get("enabled", True):
            continue
        inject_into: list[str] = source.get("inject_into", [])
        if inject_key not in inject_into:
            continue
        text = _read_source(modality, source)
        if text:
            parts.append(text)

    return "\n\n---\n\n".join(parts)


# ── Public API ──


def get_system_context(modality: str) -> str:
    """Return context destined for the LLM **system** prompt for the given modality."""
    return _gather(modality, "system")


def get_seed_context(modality: str) -> str:
    """Return context used when generating **seed** (gen-0) programs."""
    return _gather(modality, "seed")


def get_evolve_context(modality: str) -> str:
    """Return context used when **evolving** from parent programs."""
    return _gather(modality, "evolve")


def reload(modality: str | None = None) -> None:
    """Force-reload manifests and clear the file cache.

    If *modality* is given, only that modality is reloaded.
    """
    if modality:
        _manifests.pop(modality, None)
        keys_to_remove = [k for k in _file_cache if k.startswith(f"{modality}/")]
        for k in keys_to_remove:
            del _file_cache[k]
        _load_manifest(modality)
    else:
        _manifests.clear()
        _file_cache.clear()
    logger.info("Context reloaded (modality=%s)", modality or "all")


def list_sources(modality: str) -> list[dict[str, Any]]:
    """Return the full manifest for a modality (e.g. admin endpoint)."""
    return list(_load_manifest(modality))


def list_modalities() -> list[str]:
    """Return all available modality keys by scanning context folder names."""
    if not _CONTEXT_ROOT.exists():
        return []
    return sorted(
        d.name
        for d in _CONTEXT_ROOT.iterdir()
        if d.is_dir() and (d / "manifest.yaml").exists()
    )
