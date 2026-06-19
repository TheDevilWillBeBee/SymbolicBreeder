"""Context library CRUD — /api/sandbox/contexts/..."""

from fastapi import APIRouter, HTTPException

from ..schemas import (
    ContextDuplicateRequest,
    ContextUpdateRequest,
    ContextVersionDetail,
    ContextVersionSummary,
)
from ..services import context_io as ctx
from ..services.context_io import ContextIOError

router = APIRouter(prefix="/sandbox", tags=["sandbox-contexts"])


@router.get("/contexts/{modality}", response_model=list[ContextVersionSummary])
async def list_versions(modality: str):
    try:
        return ctx.list_versions(modality)
    except ContextIOError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/contexts/{modality}/{version}", response_model=ContextVersionDetail)
async def get_version(modality: str, version: str):
    try:
        return ctx.get_version(modality, version)
    except ContextIOError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/contexts/{modality}/duplicate", response_model=ContextVersionDetail)
async def duplicate_version(modality: str, body: ContextDuplicateRequest):
    try:
        new_version = ctx.duplicate_version(modality, body.source_version, body.new_label)
        return ctx.get_version(modality, new_version)
    except ContextIOError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/contexts/{modality}/{version}", response_model=ContextVersionDetail)
async def update_version(modality: str, version: str, body: ContextUpdateRequest):
    try:
        return ctx.update_version(
            modality=modality,
            version=version,
            manifest=body.manifest,
            prompt_bundle=body.prompt_bundle,
            sources=body.sources,
        )
    except ContextIOError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/contexts/{modality}/{version}")
async def delete_version(modality: str, version: str):
    try:
        dest = ctx.soft_delete_version(modality, version)
        return {"status": "deleted", "trashed_to": str(dest)}
    except ContextIOError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
