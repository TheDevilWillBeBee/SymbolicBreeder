"""Sandbox background jobs — /api/sandbox/jobs/..."""

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session as DBSession

from .. import models as sb_models
from ..database import get_sandbox_db
from ..schemas import JobCreate, JobItem
from ..services import job_manager
from ..services.generation import normalize_version

router = APIRouter(prefix="/sandbox", tags=["sandbox-jobs"])


@router.post("/jobs", response_model=JobItem)
async def create_job(
    body: JobCreate,
    db: DBSession = Depends(get_sandbox_db),
    x_api_key: Optional[str] = Header(default=None),
):
    if body.mode not in ("seed", "evolve"):
        raise HTTPException(status_code=400, detail="mode must be 'seed' or 'evolve'")
    if body.use_parents and body.mode != "evolve":
        raise HTTPException(status_code=400, detail="use_parents requires mode='evolve'")
    if body.use_parents and not body.parent_pool:
        raise HTTPException(
            status_code=400, detail="use_parents=true requires a non-empty parent_pool",
        )
    if body.use_guidance and not body.prompt_pool:
        raise HTTPException(
            status_code=400, detail="use_guidance=true requires a non-empty prompt_pool",
        )

    job = sb_models.SandboxJob(
        label=body.label,
        modality=body.modality,
        context_version=normalize_version(body.context_version),
        context_profile=body.context_profile,
        mode=body.mode,
        use_guidance=body.use_guidance,
        use_parents=body.use_parents,
        parents_per_sample=body.parents_per_sample,
        provider=body.provider,
        model=body.model,
        base_url=body.base_url,
        target_count=body.target_count,
        completed_count=0,
        failed_count=0,
        status="pending",
        prompt_pool=body.prompt_pool,
        parent_pool=body.parent_pool,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    job_manager.enqueue(job.id, x_api_key)
    return JobItem.model_validate(job)


@router.get("/jobs", response_model=list[JobItem])
async def list_jobs(
    modality: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: DBSession = Depends(get_sandbox_db),
):
    q = db.query(sb_models.SandboxJob)
    if modality:
        q = q.filter(sb_models.SandboxJob.modality == modality)
    if status:
        q = q.filter(sb_models.SandboxJob.status == status)
    q = q.order_by(sb_models.SandboxJob.created_at.desc()).limit(limit)
    return [JobItem.model_validate(j) for j in q.all()]


@router.get("/jobs/{job_id}", response_model=JobItem)
async def get_job(job_id: str, db: DBSession = Depends(get_sandbox_db)):
    job = db.query(sb_models.SandboxJob).filter(sb_models.SandboxJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobItem.model_validate(job)


@router.post("/jobs/{job_id}/cancel", response_model=JobItem)
async def cancel_job(job_id: str, db: DBSession = Depends(get_sandbox_db)):
    await job_manager.cancel(job_id)
    job = db.query(sb_models.SandboxJob).filter(sb_models.SandboxJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobItem.model_validate(job)


@router.post("/jobs/{job_id}/retry", response_model=JobItem)
async def retry_job(
    job_id: str,
    db: DBSession = Depends(get_sandbox_db),
    x_api_key: Optional[str] = Header(default=None),
):
    """Spawn a fresh job using the same parameters as the given job."""
    src = db.query(sb_models.SandboxJob).filter(sb_models.SandboxJob.id == job_id).first()
    if not src:
        raise HTTPException(status_code=404, detail="Job not found")

    job = sb_models.SandboxJob(
        label=(src.label or "") + " (retry)" if src.label else None,
        modality=src.modality,
        context_version=src.context_version,
        context_profile=src.context_profile,
        mode=src.mode,
        use_guidance=src.use_guidance,
        use_parents=src.use_parents,
        parents_per_sample=src.parents_per_sample,
        provider=src.provider,
        model=src.model,
        base_url=src.base_url,
        target_count=src.target_count,
        completed_count=0,
        failed_count=0,
        status="pending",
        prompt_pool=src.prompt_pool,
        parent_pool=src.parent_pool,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    job_manager.enqueue(job.id, x_api_key)
    return JobItem.model_validate(job)


@router.get("/jobs/{job_id}/stream")
async def stream_job(job_id: str):
    async def _gen():
        async for ev in job_manager.stream_progress(job_id):
            yield ev

    return StreamingResponse(
        _gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, db: DBSession = Depends(get_sandbox_db)):
    job = db.query(sb_models.SandboxJob).filter(sb_models.SandboxJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status in ("running", "pending"):
        await job_manager.cancel(job_id)
    db.delete(job)
    db.commit()
    return {"status": "deleted"}
