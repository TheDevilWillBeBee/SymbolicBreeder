"""In-process asyncio job manager for sandbox bulk generation.

Each job is persisted in ``sandbox_jobs``; per-sample inserts checkpoint the
``completed_count`` so progress is durable. On app startup, any job left in
``running`` is flipped to ``interrupted`` (see ``sweep_orphans``) — the user
can press Retry to start a fresh job with the same parameters.

Progress is published via per-job ``asyncio.Queue`` for SSE consumers. The
queue is in-memory only; a refresh/page change uses the GET /jobs/{id} polling
endpoint instead.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import random
from datetime import datetime, timezone
from typing import Any, AsyncIterator

from .. import models as sb_models
from ..database import SandboxSessionLocal
from .generation import build_spec, generate_one

logger = logging.getLogger(__name__)


_CONCURRENCY = int(os.getenv("SANDBOX_MAX_CONCURRENT_JOBS", "4") or 4)
_semaphore: asyncio.Semaphore | None = None
_tasks: dict[str, asyncio.Task[Any]] = {}
_queues: dict[str, list[asyncio.Queue[dict[str, Any]]]] = {}


def _get_semaphore() -> asyncio.Semaphore:
    global _semaphore
    if _semaphore is None:
        _semaphore = asyncio.Semaphore(_CONCURRENCY)
    return _semaphore


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _publish(job_id: str, payload: dict[str, Any]) -> None:
    queues = _queues.get(job_id, [])
    for q in list(queues):
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            logger.warning("Job %s queue full — dropping update", job_id)


def subscribe(job_id: str) -> asyncio.Queue[dict[str, Any]]:
    q: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=200)
    _queues.setdefault(job_id, []).append(q)
    return q


def unsubscribe(job_id: str, q: asyncio.Queue[dict[str, Any]]) -> None:
    queues = _queues.get(job_id)
    if not queues:
        return
    try:
        queues.remove(q)
    except ValueError:
        pass
    if not queues:
        _queues.pop(job_id, None)


def sweep_orphans() -> int:
    """At startup, any job left in 'running' or 'pending' is interrupted."""
    db = SandboxSessionLocal()
    try:
        n = (
            db.query(sb_models.SandboxJob)
            .filter(sb_models.SandboxJob.status.in_(["running", "pending"]))
            .update({"status": "interrupted", "finished_at": _now()}, synchronize_session=False)
        )
        db.commit()
        return int(n)
    finally:
        db.close()


def enqueue(job_id: str, api_key: str | None) -> None:
    """Spawn the worker task for an existing pending job row."""
    if job_id in _tasks and not _tasks[job_id].done():
        return  # already running
    loop = asyncio.get_event_loop()
    task = loop.create_task(_run_job(job_id, api_key))
    _tasks[job_id] = task
    task.add_done_callback(lambda _t, jid=job_id: _tasks.pop(jid, None))


async def cancel(job_id: str) -> bool:
    task = _tasks.get(job_id)
    if task and not task.done():
        task.cancel()
        return True

    # Even without an active task, flip status if pending
    db = SandboxSessionLocal()
    try:
        job = db.query(sb_models.SandboxJob).filter(sb_models.SandboxJob.id == job_id).first()
        if job and job.status in ("pending", "running"):
            job.status = "cancelled"
            job.finished_at = _now()
            db.commit()
            _publish(job_id, {"type": "status", "status": "cancelled"})
            return True
        return False
    finally:
        db.close()


async def _run_job(job_id: str, api_key: str | None) -> None:
    sem = _get_semaphore()
    async with sem:
        await _run_job_body(job_id, api_key)


async def _run_job_body(job_id: str, api_key: str | None) -> None:
    db = SandboxSessionLocal()
    try:
        job = db.query(sb_models.SandboxJob).filter(sb_models.SandboxJob.id == job_id).first()
        if not job:
            return
        if job.status in ("cancelled", "done", "failed"):
            return

        job.status = "running"
        job.started_at = _now()
        job.completed_count = 0
        job.failed_count = 0
        job.error_message = None
        db.commit()
        _publish(job_id, {
            "type": "status",
            "status": "running",
            "completed": 0,
            "failed": 0,
            "target": job.target_count,
        })

        rng = random.Random()
        target = int(job.target_count)
        prompt_pool = list(job.prompt_pool or [])
        parent_pool = list(job.parent_pool or [])

        try:
            for _i in range(target):
                # Cancellation check
                await asyncio.sleep(0)  # yield
                spec = build_spec(
                    modality=job.modality,
                    context_version=job.context_version,
                    context_profile=job.context_profile,
                    mode=job.mode,
                    use_guidance=bool(job.use_guidance),
                    use_parents=bool(job.use_parents),
                    parents_per_sample=int(job.parents_per_sample or 1),
                    prompt_pool=prompt_pool,
                    parent_pool=parent_pool,
                    provider=job.provider,
                    model=job.model,
                    base_url=job.base_url,
                    api_key=api_key,
                    rng=rng,
                )
                sample = await generate_one(spec)

                row = sb_models.SandboxSample(
                    job_id=job.id,
                    modality=job.modality,
                    context_version=job.context_version,
                    context_profile=job.context_profile,
                    mode=job.mode,
                    use_guidance=bool(job.use_guidance),
                    use_parents=bool(job.use_parents),
                    provider=job.provider,
                    model=job.model,
                    base_url=job.base_url,
                    prompt=spec.guidance,
                    prompt_flat=sample.prompt_flat,
                    parents_json=spec.parents,
                    code=sample.code,
                    error=sample.error,
                    latency_ms=sample.latency_ms,
                    source=sample.source,
                )
                db.add(row)
                if sample.error:
                    job.failed_count = int(job.failed_count or 0) + 1
                job.completed_count = int(job.completed_count or 0) + 1
                db.commit()
                db.refresh(row)

                _publish(job_id, {
                    "type": "sample",
                    "completed": job.completed_count,
                    "failed": job.failed_count,
                    "target": job.target_count,
                    "sample_id": row.id,
                    "source": sample.source,
                    "error": sample.error,
                })

            job.status = "done"
            job.finished_at = _now()
            db.commit()
            _publish(job_id, {
                "type": "status",
                "status": "done",
                "completed": job.completed_count,
                "failed": job.failed_count,
                "target": job.target_count,
            })
        except asyncio.CancelledError:
            job.status = "cancelled"
            job.finished_at = _now()
            db.commit()
            _publish(job_id, {
                "type": "status",
                "status": "cancelled",
                "completed": job.completed_count,
                "failed": job.failed_count,
                "target": job.target_count,
            })
            raise
        except Exception as exc:  # noqa: BLE001
            logger.exception("Sandbox job %s failed", job_id)
            job.status = "failed"
            job.error_message = f"{type(exc).__name__}: {exc}"
            job.finished_at = _now()
            db.commit()
            _publish(job_id, {
                "type": "status",
                "status": "failed",
                "error": job.error_message,
                "completed": job.completed_count,
                "failed": job.failed_count,
                "target": job.target_count,
            })
    finally:
        db.close()


async def stream_progress(job_id: str) -> AsyncIterator[str]:
    """SSE stream for a job: initial snapshot, then live updates."""
    db = SandboxSessionLocal()
    try:
        job = db.query(sb_models.SandboxJob).filter(sb_models.SandboxJob.id == job_id).first()
        if not job:
            yield _sse_event("error", {"message": "job_not_found"})
            return
        initial = {
            "type": "snapshot",
            "status": job.status,
            "completed": job.completed_count,
            "failed": job.failed_count,
            "target": job.target_count,
            "error": job.error_message,
        }
    finally:
        db.close()

    yield _sse_event("snapshot", initial)
    if initial["status"] in ("done", "failed", "cancelled", "interrupted"):
        return

    q = subscribe(job_id)
    try:
        while True:
            try:
                payload = await asyncio.wait_for(q.get(), timeout=30.0)
            except asyncio.TimeoutError:
                yield _sse_event("ping", {"ts": _now().isoformat()})
                continue

            event = payload.get("type", "update")
            yield _sse_event(event, payload)

            if event == "status" and payload.get("status") in ("done", "failed", "cancelled", "interrupted"):
                return
    finally:
        unsubscribe(job_id, q)


def _sse_event(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"
