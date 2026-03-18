"""Context loader — reads per-modality reference data from backend/context/.

Each modality has its own subfolder under backend/context/ with a manifest.yaml
(v2 format) that defines profiles (simple/intermediate/advanced) and sources.

Usage::

    from app.services.context import get_system_context, get_prompt_config

    system_ctx = get_system_context("shader", profile="intermediate")
    prompts   = get_prompt_config("shader")

Adding a new modality:
    1. Create backend/context/<modality_key>/manifest.yaml (v2 format)
    2. Populate tutorial .md files and a prompts/prompt_bundle.yaml
    3. No Python changes required — auto-discovered by folder name.
"""

import logging
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger(__name__)

# Resolve the context root directory (backend/context/)
_CONTEXT_ROOT = Path(__file__).resolve().parent.parent.parent / "context"

# ── Internal caches ──
_raw_manifests: dict[str, dict[str, Any]] = {}
_file_cache: dict[str, str] = {}
_prompt_configs: dict[str, dict[str, str]] = {}
_profile_source_ids: dict[str, set[str]] = {}  # key: "modality:profile"
_context_cache: dict[str, str] = {}  # key: "modality:profile:inject_key"


def _load_raw_manifest(modality: str) -> dict[str, Any]:
    """Load and cache the raw manifest dict for a given modality."""
    if modality in _raw_manifests:
        return _raw_manifests[modality]

    manifest_path = _CONTEXT_ROOT / modality / "manifest.yaml"
    if not manifest_path.exists():
        logger.warning("Context manifest not found at %s", manifest_path)
        _raw_manifests[modality] = {}
        return _raw_manifests[modality]

    with open(manifest_path) as f:
        data = yaml.safe_load(f) or {}

    _raw_manifests[modality] = data
    logger.info(
        "Loaded context manifest for '%s' (v%s) with %d sources",
        modality,
        data.get("version", "?"),
        len(data.get("sources", [])),
    )
    return data


def _resolve_profile_source_ids(modality: str, profile: str) -> set[str]:
    """Resolve the full set of source IDs for a profile (including inherited)."""
    cache_key = f"{modality}:{profile}"
    if cache_key in _profile_source_ids:
        return _profile_source_ids[cache_key]

    manifest = _load_raw_manifest(modality)
    profiles = manifest.get("profiles", {})
    profile_def = profiles.get(profile)
    if not profile_def:
        logger.warning("Profile '%s' not found for modality '%s'", profile, modality)
        _profile_source_ids[cache_key] = set()
        return _profile_source_ids[cache_key]

    # Recursively resolve parent profile
    ids: set[str] = set()
    parent = profile_def.get("extends")
    if parent:
        ids = set(_resolve_profile_source_ids(modality, parent))

    ids.update(profile_def.get("includes", []))
    _profile_source_ids[cache_key] = ids
    return ids


def _read_source(modality: str, rel_path: str) -> str:
    """Read and cache a single source file."""
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


def _gather(modality: str, profile: str, inject_key: str) -> str:
    """Gather all enabled sources matching *inject_key* for the given profile."""
    cache_key = f"{modality}:{profile}:{inject_key}"
    if cache_key in _context_cache:
        return _context_cache[cache_key]

    manifest = _load_raw_manifest(modality)
    sources = manifest.get("sources", [])
    allowed_ids = _resolve_profile_source_ids(modality, profile)

    parts: list[str] = []
    for source in sources:
        if not source.get("enabled", True):
            continue
        if source["id"] not in allowed_ids:
            continue
        inject_into: list[str] = source.get("inject_into", [])
        if inject_key not in inject_into:
            continue
        text = _read_source(modality, source["path"])
        if text:
            parts.append(text)

    result = "\n\n---\n\n".join(parts)
    _context_cache[cache_key] = result
    return result


# ── Public API ──


def get_system_context(modality: str, profile: str = "intermediate") -> str:
    """Return context destined for the LLM **system** prompt for the given modality and profile."""
    return _gather(modality, profile, "system")


def get_prompt_config(modality: str) -> dict[str, str]:
    """Return the prompt bundle dict (role, seed_prompt, evolve_prompt, variety_suffix)."""
    if modality in _prompt_configs:
        return _prompt_configs[modality]

    manifest = _load_raw_manifest(modality)
    bundle_ref = manifest.get("prompt_bundle", {})
    bundle_path = bundle_ref.get("path")
    if not bundle_path:
        logger.warning("No prompt_bundle path in manifest for '%s'", modality)
        _prompt_configs[modality] = {}
        return _prompt_configs[modality]

    full_path = _CONTEXT_ROOT / modality / bundle_path
    if not full_path.exists():
        logger.warning("Prompt bundle file missing: %s", full_path)
        _prompt_configs[modality] = {}
        return _prompt_configs[modality]

    with open(full_path) as f:
        data = yaml.safe_load(f) or {}

    config = {
        "role": data.get("role", ""),
        "seed_prompt": data.get("seed_prompt", ""),
        "evolve_prompt": data.get("evolve_prompt", ""),
        "variety_suffix": data.get("variety_suffix", ""),
    }
    _prompt_configs[modality] = config
    return config


def get_context_version(modality: str) -> int:
    """Return the context version from the manifest."""
    manifest = _load_raw_manifest(modality)
    return manifest.get("version", 1)


def get_default_profile(modality: str) -> str:
    """Return the default profile from the manifest."""
    manifest = _load_raw_manifest(modality)
    return manifest.get("default_profile", "intermediate")


def reload(modality: str | None = None) -> None:
    """Force-reload manifests and clear all caches.

    If *modality* is given, only that modality is reloaded.
    """
    if modality:
        _raw_manifests.pop(modality, None)
        _prompt_configs.pop(modality, None)
        keys_to_remove = [k for k in _file_cache if k.startswith(f"{modality}/")]
        for k in keys_to_remove:
            del _file_cache[k]
        keys_to_remove = [k for k in _profile_source_ids if k.startswith(f"{modality}:")]
        for k in keys_to_remove:
            del _profile_source_ids[k]
        keys_to_remove = [k for k in _context_cache if k.startswith(f"{modality}:")]
        for k in keys_to_remove:
            del _context_cache[k]
    else:
        _raw_manifests.clear()
        _file_cache.clear()
        _prompt_configs.clear()
        _profile_source_ids.clear()
        _context_cache.clear()
    logger.info("Context reloaded (modality=%s)", modality or "all")


def list_sources(modality: str) -> list[dict[str, Any]]:
    """Return the full source list for a modality (e.g. admin endpoint)."""
    manifest = _load_raw_manifest(modality)
    return list(manifest.get("sources", []))


def list_modalities() -> list[str]:
    """Return all available modality keys by scanning context folder names."""
    if not _CONTEXT_ROOT.exists():
        return []
    return sorted(
        d.name
        for d in _CONTEXT_ROOT.iterdir()
        if d.is_dir() and (d / "manifest.yaml").exists()
    )
