"""Synchronous-ish multi-context quick test — SSE stream.

Generates ``count`` samples for each selected context version, persists every
sample into ``sandbox_samples`` (with a shared ``quick_test_session_id`` so the
UI can group them), and streams progress events to the client.
"""

from __future__ import annotations

import asyncio
import json
import logging
import random
import uuid
from typing import Optional

from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse

from .. import models as sb_models
from ..database import SandboxSessionLocal
from ..schemas import QuickTestRequest
from ..services.generation import build_spec, generate_one, normalize_version

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sandbox", tags=["sandbox-quick-test"])


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"


@router.post("/quick-test/stream")
async def quick_test_stream(body: QuickTestRequest, x_api_key: Optional[str] = Header(default=None)):
    session_id = str(uuid.uuid4())

    async def _gen():
        yield _sse("session", {"quick_test_session_id": session_id})

        versions = body.context_versions or ["default"]
        total = len(versions) * body.count
        completed = 0
        rng = random.Random()

        for version in versions:
            normalized = normalize_version(version)
            for i in range(body.count):
                spec = build_spec(
                    modality=body.modality,
                    context_version=normalized,
                    context_profile=body.context_profile,
                    mode=body.mode,
                    use_guidance=body.use_guidance,
                    use_parents=body.use_parents,
                    parents_per_sample=body.parents_per_sample,
                    prompt_pool=body.prompt_pool,
                    parent_pool=body.parent_pool,
                    provider=body.provider,
                    model=body.model,
                    base_url=body.base_url,
                    api_key=x_api_key,
                    rng=rng,
                )
                sample = await generate_one(spec)

                db = SandboxSessionLocal()
                try:
                    row = sb_models.SandboxSample(
                        job_id=None,
                        quick_test_session_id=session_id,
                        modality=body.modality,
                        context_version=normalized,
                        context_profile=body.context_profile,
                        mode=body.mode,
                        use_guidance=body.use_guidance,
                        use_parents=body.use_parents,
                        provider=body.provider,
                        model=body.model,
                        base_url=body.base_url,
                        prompt=spec.guidance,
                        prompt_flat=sample.prompt_flat,
                        parents_json=spec.parents,
                        code=sample.code,
                        error=sample.error,
                        latency_ms=sample.latency_ms,
                        source=sample.source,
                    )
                    db.add(row)
                    db.commit()
                    db.refresh(row)
                    sample_payload = {
                        "id": row.id,
                        "context_version": version,
                        "context_version_label": version,
                        "modality": row.modality,
                        "code": row.code,
                        "prompt": row.prompt,
                        "prompt_flat": row.prompt_flat,
                        "parents": row.parents_json,
                        "model": row.model,
                        "provider": row.provider,
                        "source": row.source,
                        "error": row.error,
                        "latency_ms": row.latency_ms,
                        "created_at": row.created_at.isoformat() if row.created_at else None,
                    }
                finally:
                    db.close()

                completed += 1
                yield _sse(
                    "sample",
                    {
                        "completed": completed,
                        "total": total,
                        "context_version": version,
                        "sample_index": i,
                        "sample": sample_payload,
                    },
                )
                # Yield control so the client can drain the buffer.
                await asyncio.sleep(0)

        yield _sse("done", {"completed": completed, "total": total, "quick_test_session_id": session_id})

    return StreamingResponse(
        _gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
