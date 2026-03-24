"""Context loader — reads per-modality reference data from disk.

**App default** — ``backend/context/<modality>/`` (no ``context_version`` in API calls).

**Versioned libraries** — ``backend/context_lib/<modality>/vN/`` must contain the full
tutorial tree and ``prompts/`` referenced by the merged manifest; content is read
only from that ``vN`` directory (no fallback to the app default tree). Manifests may
still ``extends_manifest`` the app YAML for structure. API: ``shader@v1``, etc.

Usage::

    from app.services.context import get_system_context, get_prompt_config

    system_ctx = get_system_context("shader", profile="intermediate")
    prompts   = get_prompt_config("shader")

Adding a version library: copy the full ``context/<modality>/`` tree into
``context_lib/<modality>/vN/`` and keep ``manifest.yaml`` (e.g. ``extends_manifest``).
"""

import logging
from pathlib import Path
import re
from typing import Any

import yaml

logger = logging.getLogger(__name__)

# App default context (backend/context/) and optional version libraries (backend/context_lib/)
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
_CONTEXT_ROOT = _BACKEND_ROOT / "context"
_CONTEXT_LIB_ROOT = _BACKEND_ROOT / "context_lib"

# ── Internal caches ──
_raw_manifests: dict[str, dict[str, Any]] = {}
_file_cache: dict[str, str] = {}
_prompt_configs: dict[str, dict[str, str]] = {}
_profile_source_ids: dict[str, set[str]] = {}  # key: "modality:profile"
_context_cache: dict[str, str] = {}  # key: "modality:profile:inject_key"
_manifest_base_dirs: dict[str, Path] = {}  # key: "modality[@version]" -> base dir


def _deep_merge_dict(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base)
    for key, value in override.items():
        if (
            key in merged
            and isinstance(merged[key], dict)
            and isinstance(value, dict)
        ):
            merged[key] = _deep_merge_dict(merged[key], value)
        else:
            merged[key] = value
    return merged


def _parse_modality_key(modality: str) -> tuple[str, str | None]:
    # Supports "svg", "svg@v2", and "svg:v2".
    if "@" in modality:
        base, version = modality.split("@", 1)
        return base, version
    if ":" in modality:
        base, version = modality.split(":", 1)
        return base, version
    return modality, None


def _normalize_version(version: str | None) -> str | None:
    if not version:
        return None
    v = version.strip().lower()
    return v if v.startswith("v") else f"v{v}"


def _manifest_cache_key(modality: str, version: str | None) -> str:
    return f"{modality}@{version}" if version else modality


def _load_manifest_file(manifest_path: Path, seen: set[Path] | None = None) -> dict[str, Any]:
    if seen is None:
        seen = set()
    if manifest_path in seen:
        logger.warning("Context manifest inheritance loop detected at %s", manifest_path)
        return {}
    seen.add(manifest_path)
    if not manifest_path.exists():
        return {}
    with open(manifest_path, encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    extends = data.get("extends_manifest")
    if not extends:
        return data
    parent_path = (manifest_path.parent / str(extends)).resolve()
    parent = _load_manifest_file(parent_path, seen=seen)
    child = dict(data)
    child.pop("extends_manifest", None)
    return _deep_merge_dict(parent, child)


def _load_raw_manifest(modality: str) -> dict[str, Any]:
    """Load and cache the raw manifest dict for a given modality."""
    base_modality, requested_version = _parse_modality_key(modality)
    normalized_version = _normalize_version(requested_version)
    cache_key = _manifest_cache_key(base_modality, normalized_version)
    if cache_key in _raw_manifests:
        return _raw_manifests[cache_key]

    modality_root = _CONTEXT_ROOT / base_modality
    manifest_path = modality_root / "manifest.yaml"
    if normalized_version:
        version_manifest = (
            _CONTEXT_LIB_ROOT / base_modality / normalized_version / "manifest.yaml"
        )
        if version_manifest.exists():
            manifest_path = version_manifest
        else:
            logger.warning(
                "Context version manifest not found at %s (expected under context_lib)",
                version_manifest,
            )
            _raw_manifests[cache_key] = {}
            return _raw_manifests[cache_key]

    if not manifest_path.exists():
        logger.warning("Context manifest not found at %s", manifest_path)
        _raw_manifests[cache_key] = {}
        _manifest_base_dirs[cache_key] = modality_root
        return _raw_manifests[cache_key]

    data = _load_manifest_file(manifest_path)
    _raw_manifests[cache_key] = data
    _manifest_base_dirs[cache_key] = manifest_path.parent
    logger.info(
        "Loaded context manifest for '%s' from %s (v%s) with %d sources",
        cache_key,
        manifest_path,
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


def _resolve_context_file(
    base_modality: str, manifest_key: str, rel_path: str
) -> Path | None:
    """Resolve *rel_path* under the manifest base dir only (app default or ``context_lib/.../vN``)."""
    base_dir = _manifest_base_dirs.get(manifest_key, _CONTEXT_ROOT / base_modality)
    candidate = (base_dir / rel_path).resolve()
    return candidate if candidate.is_file() else None


def _read_source(modality: str, rel_path: str) -> str:
    """Read and cache a single source file."""
    cache_key = f"{modality}/{rel_path}"
    if cache_key in _file_cache:
        return _file_cache[cache_key]

    base_modality, requested_version = _parse_modality_key(modality)
    manifest_key = _manifest_cache_key(base_modality, _normalize_version(requested_version))
    full_path = _resolve_context_file(base_modality, manifest_key, rel_path)
    if full_path is None:
        logger.warning(
            "Context source file missing for '%s': %s (under %s)",
            modality,
            rel_path,
            _manifest_base_dirs.get(manifest_key, _CONTEXT_ROOT / base_modality),
        )
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

    # Versioned keys are "shader@v1"; bundle paths resolve via manifest base (context_lib/.../v1/)
    base_modality, requested_version = _parse_modality_key(modality)
    manifest_key = _manifest_cache_key(base_modality, _normalize_version(requested_version))
    full_path = _resolve_context_file(base_modality, manifest_key, str(bundle_path))
    if full_path is None:
        logger.warning("Prompt bundle file missing for '%s': %s", modality, bundle_path)
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
        for k in list(_raw_manifests.keys()):
            if k == modality or k.startswith(f"{modality}@"):
                _raw_manifests.pop(k, None)
        for k in list(_prompt_configs.keys()):
            if k == modality or k.startswith(f"{modality}@"):
                _prompt_configs.pop(k, None)
        for k in list(_manifest_base_dirs.keys()):
            if k == modality or k.startswith(f"{modality}@"):
                _manifest_base_dirs.pop(k, None)
        keys_to_remove = [
            k
            for k in _file_cache
            if k.startswith(f"{modality}/") or k.startswith(f"{modality}@")
        ]
        for k in keys_to_remove:
            del _file_cache[k]
        keys_to_remove = [
            k
            for k in _profile_source_ids
            if k.startswith(f"{modality}:") or k.startswith(f"{modality}@")
        ]
        for k in keys_to_remove:
            del _profile_source_ids[k]
        keys_to_remove = [
            k
            for k in _context_cache
            if k.startswith(f"{modality}:") or k.startswith(f"{modality}@")
        ]
        for k in keys_to_remove:
            del _context_cache[k]
    else:
        _raw_manifests.clear()
        _file_cache.clear()
        _prompt_configs.clear()
        _profile_source_ids.clear()
        _context_cache.clear()
        _manifest_base_dirs.clear()
    logger.info("Context reloaded (modality=%s)", modality or "all")


def list_sources(modality: str) -> list[dict[str, Any]]:
    """Return the full source list for a modality (e.g. admin endpoint)."""
    manifest = _load_raw_manifest(modality)
    return list(manifest.get("sources", []))


def list_modalities() -> list[str]:
    """Return modality keys that have an app default manifest under context/."""
    if not _CONTEXT_ROOT.exists():
        return []
    return sorted(
        d.name
        for d in _CONTEXT_ROOT.iterdir()
        if d.is_dir() and (d / "manifest.yaml").exists()
    )


def list_context_versions(modality: str) -> list[str]:
    """Return version library folders under context_lib/<modality>/ (e.g. ['v1', 'v2'])."""
    root = _CONTEXT_LIB_ROOT / modality
    if not root.exists() or not root.is_dir():
        return []
    versions = [
        d.name
        for d in root.iterdir()
        if d.is_dir() and re.match(r"^v\d+$", d.name) and (d / "manifest.yaml").exists()
    ]
    return sorted(versions, key=lambda v: int(v[1:]))
