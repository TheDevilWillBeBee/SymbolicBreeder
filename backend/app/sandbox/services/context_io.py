"""Filesystem I/O for the per-version context library.

Reads and writes:
- ``backend/context/<modality>/`` (app default — read-only; cannot duplicate ONTO it)
- ``backend/context_lib/<modality>/v{N}/`` (versioned libraries — read/write)

Soft-delete moves a version into ``backend/context_lib/_trash/<modality>/<version>-<ts>/``
so accidental deletion is recoverable on disk.

Always invalidates the in-process context cache after a mutation so the next
generation call picks up the change.
"""

from __future__ import annotations

import logging
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from ...services import context as context_service
from ..schemas import (
    ContextManifest,
    ContextVersionDetail,
    ContextVersionSummary,
    PromptBundle,
    SourceFile,
)

logger = logging.getLogger(__name__)

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent.parent
CONTEXT_ROOT = _BACKEND_ROOT / "context"
CONTEXT_LIB_ROOT = _BACKEND_ROOT / "context_lib"
TRASH_ROOT = CONTEXT_LIB_ROOT / "_trash"


class ContextIOError(Exception):
    pass


VERSION_RE = re.compile(r"^v\d+$")


# ── Path helpers ──


def _modality_app_root(modality: str) -> Path:
    return CONTEXT_ROOT / modality


def _modality_lib_root(modality: str) -> Path:
    return CONTEXT_LIB_ROOT / modality


def _version_root(modality: str, version: str) -> Path:
    if version == "default":
        return _modality_app_root(modality)
    if not VERSION_RE.match(version):
        raise ContextIOError(f"Invalid version '{version}' (expected 'default' or 'vN')")
    return _modality_lib_root(modality) / version


def known_modalities() -> list[str]:
    return context_service.list_modalities()


# ── Listing ──


def list_versions(modality: str) -> list[ContextVersionSummary]:
    if modality not in known_modalities():
        raise ContextIOError(f"Unknown modality '{modality}'")

    summaries: list[ContextVersionSummary] = [
        _summarize(modality, "default", is_app_default=True),
    ]

    lib_root = _modality_lib_root(modality)
    if lib_root.exists():
        versions = [
            d.name
            for d in lib_root.iterdir()
            if d.is_dir() and VERSION_RE.match(d.name) and (d / "manifest.yaml").exists()
        ]
        versions.sort(key=lambda v: int(v[1:]))
        for v in versions:
            summaries.append(_summarize(modality, v))

    return summaries


def _summarize(modality: str, version: str, is_app_default: bool = False) -> ContextVersionSummary:
    root = _version_root(modality, version)
    if not root.exists():
        return ContextVersionSummary(
            modality=modality, version=version, is_app_default=is_app_default,
        )

    manifest_path = root / "manifest.yaml"
    file_count = 0
    source_count = 0
    label: str | None = None
    description: str | None = None
    last_modified = datetime.fromtimestamp(root.stat().st_mtime, tz=timezone.utc)

    if manifest_path.exists():
        try:
            with open(manifest_path, encoding="utf-8") as f:
                raw = yaml.safe_load(f) or {}
            resolved = _resolve_extends(manifest_path, raw)
            source_count = len(resolved.get("sources", []))
            label = raw.get("label") or resolved.get("label")
            description = raw.get("description") or resolved.get("description")
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to parse manifest for %s/%s: %s", modality, version, exc)

    for p in root.rglob("*"):
        if p.is_file():
            file_count += 1
            try:
                mt = datetime.fromtimestamp(p.stat().st_mtime, tz=timezone.utc)
                if mt > last_modified:
                    last_modified = mt
            except OSError:
                pass

    return ContextVersionSummary(
        modality=modality,
        version=version,
        is_app_default=is_app_default,
        label=label,
        description=description,
        file_count=file_count,
        source_count=source_count,
        last_modified=last_modified,
    )


# ── Reading a single version ──


def _resolve_extends(manifest_path: Path, raw: dict[str, Any]) -> dict[str, Any]:
    extends = raw.get("extends_manifest")
    if not extends:
        return raw
    parent_path = (manifest_path.parent / str(extends)).resolve()
    if not parent_path.exists():
        return raw
    with open(parent_path, encoding="utf-8") as f:
        parent_raw = yaml.safe_load(f) or {}
    parent_resolved = _resolve_extends(parent_path, parent_raw)
    merged = _deep_merge(parent_resolved, {k: v for k, v in raw.items() if k != "extends_manifest"})
    return merged


def _deep_merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    out = dict(base)
    for k, v in override.items():
        if k in out and isinstance(out[k], dict) and isinstance(v, dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def get_version(modality: str, version: str) -> ContextVersionDetail:
    if modality not in known_modalities():
        raise ContextIOError(f"Unknown modality '{modality}'")

    root = _version_root(modality, version)
    is_default = version == "default"
    manifest_path = root / "manifest.yaml"
    if not manifest_path.exists():
        raise ContextIOError(f"Manifest not found at {manifest_path}")

    raw_yaml_text = manifest_path.read_text(encoding="utf-8")
    raw = yaml.safe_load(raw_yaml_text) or {}
    resolved = _resolve_extends(manifest_path, raw)

    manifest = ContextManifest(
        version=int(resolved.get("version", 1) or 1),
        modality=str(resolved.get("modality", modality)),
        default_profile=str(resolved.get("default_profile", "intermediate")),
        profiles=dict(resolved.get("profiles", {}) or {}),
        sources=list(resolved.get("sources", []) or []),
        prompt_bundle=dict(resolved.get("prompt_bundle", {}) or {}),
        extends_manifest=raw.get("extends_manifest"),
        raw_yaml=raw_yaml_text,
    )

    # Prompt bundle — looked up via the resolved manifest's path; bundles can
    # live in the parent (app) tree when a version only extends.
    bundle = _read_prompt_bundle(modality, version, resolved)

    # Source files — read by id from the merged sources list. Path resolution
    # tries the version dir first, then the parent (app) tree, matching the
    # runtime loader.
    sources: list[SourceFile] = []
    for s in manifest.sources:
        try:
            text = _read_source_file(modality, version, s.get("path", ""))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Could not read source %s: %s", s.get("path"), exc)
            text = ""
        sources.append(
            SourceFile(
                id=str(s.get("id", "")),
                path=str(s.get("path", "")),
                text=text,
                inject_into=list(s.get("inject_into", []) or []),
                enabled=bool(s.get("enabled", True)),
                level=s.get("level"),
                category=s.get("category"),
                description=s.get("description"),
            )
        )

    return ContextVersionDetail(
        modality=modality,
        version=version,
        is_app_default=is_default,
        manifest=manifest,
        prompt_bundle=bundle,
        sources=sources,
    )


def _read_prompt_bundle(modality: str, version: str, resolved_manifest: dict[str, Any]) -> PromptBundle:
    bundle_ref = resolved_manifest.get("prompt_bundle", {}) or {}
    rel_path = bundle_ref.get("path")
    if not rel_path:
        return PromptBundle()

    candidate = _resolve_path(modality, version, str(rel_path))
    if not candidate or not candidate.exists():
        return PromptBundle()
    raw_yaml_text = candidate.read_text(encoding="utf-8")
    data = yaml.safe_load(raw_yaml_text) or {}
    return PromptBundle(
        role=str(data.get("role", "") or ""),
        seed_prompt=str(data.get("seed_prompt", "") or ""),
        evolve_prompt=str(data.get("evolve_prompt", "") or ""),
        variety_suffix=str(data.get("variety_suffix", "") or ""),
        raw_yaml=raw_yaml_text,
    )


def _read_source_file(modality: str, version: str, rel_path: str) -> str:
    candidate = _resolve_path(modality, version, rel_path)
    if not candidate or not candidate.exists():
        return ""
    return candidate.read_text(encoding="utf-8")


def _resolve_path(modality: str, version: str, rel_path: str) -> Path | None:
    """Resolve rel_path under version root first, then fall back to app default."""
    if not rel_path:
        return None
    root = _version_root(modality, version)
    primary = (root / rel_path).resolve()
    if primary.exists():
        return primary
    if version != "default":
        secondary = (_modality_app_root(modality) / rel_path).resolve()
        if secondary.exists():
            return secondary
    return None


# ── Mutations ──


def duplicate_version(modality: str, source_version: str, new_label: str | None) -> str:
    """Duplicate ``source_version`` into the next free vN slot. Returns the new version name."""
    if modality not in known_modalities():
        raise ContextIOError(f"Unknown modality '{modality}'")

    src = _version_root(modality, source_version)
    if not src.exists():
        raise ContextIOError(f"Source version '{source_version}' not found")

    lib_root = _modality_lib_root(modality)
    lib_root.mkdir(parents=True, exist_ok=True)

    existing_nums = []
    for d in lib_root.iterdir():
        if d.is_dir() and VERSION_RE.match(d.name):
            try:
                existing_nums.append(int(d.name[1:]))
            except ValueError:
                pass
    next_n = max(existing_nums, default=0) + 1
    new_version = f"v{next_n}"
    dest = lib_root / new_version

    # Full copy: prompts, profile docs, manifest, etc.
    shutil.copytree(src, dest)

    # Rewrite manifest so it no longer extends the source's parent; instead it
    # captures the merged shape and an optional label. This makes the version
    # self-contained and decoupled from the app default.
    src_manifest_path = src / "manifest.yaml"
    new_manifest_path = dest / "manifest.yaml"
    if src_manifest_path.exists():
        raw = yaml.safe_load(src_manifest_path.read_text(encoding="utf-8")) or {}
        resolved = _resolve_extends(src_manifest_path, raw)
        if new_label is not None:
            resolved["label"] = new_label
        else:
            resolved.setdefault("label", f"Copy of {source_version}")
        # Remove extends_manifest so the new copy stands on its own
        resolved.pop("extends_manifest", None)
        new_manifest_path.write_text(yaml.safe_dump(resolved, sort_keys=False), encoding="utf-8")

    # Ensure prompt_bundle and source files exist locally even if they were
    # being inherited from the parent app tree.
    _materialize_inherited_files(modality, source_version, dest)

    _invalidate_runtime_caches(modality)
    return new_version


def _materialize_inherited_files(modality: str, source_version: str, dest_root: Path) -> None:
    manifest_path = dest_root / "manifest.yaml"
    if not manifest_path.exists():
        return
    raw = yaml.safe_load(manifest_path.read_text(encoding="utf-8")) or {}

    # Copy prompt bundle from app default if it was being inherited.
    bundle_ref = raw.get("prompt_bundle", {}) or {}
    bundle_rel = bundle_ref.get("path")
    if bundle_rel:
        local_bundle = (dest_root / bundle_rel).resolve()
        if not local_bundle.exists():
            inherited = _resolve_path(modality, source_version, str(bundle_rel))
            if inherited and inherited.exists():
                local_bundle.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(inherited, local_bundle)

    for s in raw.get("sources", []) or []:
        rel_path = s.get("path")
        if not rel_path:
            continue
        local = (dest_root / rel_path).resolve()
        if local.exists():
            continue
        inherited = _resolve_path(modality, source_version, str(rel_path))
        if inherited and inherited.exists():
            local.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(inherited, local)


def soft_delete_version(modality: str, version: str) -> Path:
    if version == "default":
        raise ContextIOError("Cannot delete the app default context")
    if not VERSION_RE.match(version):
        raise ContextIOError(f"Invalid version '{version}'")

    src = _version_root(modality, version)
    if not src.exists():
        raise ContextIOError(f"Version '{version}' not found")

    ts = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%S")
    dest = TRASH_ROOT / modality / f"{version}-{ts}"
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dest))
    _invalidate_runtime_caches(modality)
    return dest


def update_version(
    modality: str,
    version: str,
    manifest: ContextManifest | None,
    prompt_bundle: PromptBundle | None,
    sources: list[SourceFile] | None,
) -> ContextVersionDetail:
    """Partial update — only provided pieces are written."""
    if version == "default":
        raise ContextIOError("App default is read-only. Duplicate it first.")
    root = _version_root(modality, version)
    if not root.exists():
        raise ContextIOError(f"Version '{version}' not found")

    if manifest is not None:
        _write_manifest(root, manifest)
    if prompt_bundle is not None:
        _write_prompt_bundle(root, modality, version, prompt_bundle)
    if sources is not None:
        _write_sources(root, sources)

    _invalidate_runtime_caches(modality)
    return get_version(modality, version)


def _write_manifest(root: Path, manifest: ContextManifest) -> None:
    if manifest.raw_yaml is not None:
        # Validate by parsing
        try:
            yaml.safe_load(manifest.raw_yaml)
        except yaml.YAMLError as exc:
            raise ContextIOError(f"Invalid manifest YAML: {exc}") from exc
        (root / "manifest.yaml").write_text(manifest.raw_yaml, encoding="utf-8")
        return

    data: dict[str, Any] = {
        "version": manifest.version,
        "modality": manifest.modality,
        "default_profile": manifest.default_profile,
        "profiles": manifest.profiles,
        "sources": manifest.sources,
        "prompt_bundle": manifest.prompt_bundle,
    }
    # Don't write extends_manifest by default — duplicate already stripped it.
    text = yaml.safe_dump(data, sort_keys=False)
    (root / "manifest.yaml").write_text(text, encoding="utf-8")


def _write_prompt_bundle(
    root: Path, modality: str, version: str, bundle: PromptBundle
) -> None:
    # Find the prompt_bundle path from the current manifest
    manifest_path = root / "manifest.yaml"
    if not manifest_path.exists():
        return
    raw = yaml.safe_load(manifest_path.read_text(encoding="utf-8")) or {}
    bundle_ref = (raw.get("prompt_bundle") or {})
    rel_path = bundle_ref.get("path") or "prompts/prompt_bundle.yaml"
    target = (root / rel_path).resolve()
    target.parent.mkdir(parents=True, exist_ok=True)

    if bundle.raw_yaml is not None:
        try:
            yaml.safe_load(bundle.raw_yaml)
        except yaml.YAMLError as exc:
            raise ContextIOError(f"Invalid prompt_bundle YAML: {exc}") from exc
        target.write_text(bundle.raw_yaml, encoding="utf-8")
        return

    data = {
        "role": bundle.role,
        "seed_prompt": bundle.seed_prompt,
        "evolve_prompt": bundle.evolve_prompt,
        "variety_suffix": bundle.variety_suffix,
    }
    target.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")


def _write_sources(root: Path, sources: list[SourceFile]) -> None:
    for s in sources:
        if not s.path:
            continue
        target = (root / s.path).resolve()
        # Safety: ensure we stay within root
        try:
            target.relative_to(root.resolve())
        except ValueError as exc:
            raise ContextIOError(f"Refusing to write outside version root: {s.path}") from exc
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(s.text, encoding="utf-8")


# ── Cache invalidation ──


def _invalidate_runtime_caches(modality: str) -> None:
    try:
        context_service.reload(modality)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to invalidate context cache for %s: %s", modality, exc)
