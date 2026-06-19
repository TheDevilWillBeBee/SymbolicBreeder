"""Sample query / detail / aggregation endpoints — /api/sandbox/samples/..."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func
from sqlalchemy.orm import Session as DBSession

from .. import models as sb_models
from ..database import get_sandbox_db
from ..schemas import SampleItem, SampleListResponse, SamplesStats, StatsBucket, TimeBucket

router = APIRouter(prefix="/sandbox", tags=["sandbox-samples"])


def _apply_filters(
    q,
    *,
    modality: Optional[str],
    context_versions: list[str],
    modes: list[str],
    models: list[str],
    providers: list[str],
    use_guidance: Optional[bool],
    use_parents: Optional[bool],
    date_from: Optional[datetime],
    date_to: Optional[datetime],
    prompt_contains: Optional[str],
    job_id: Optional[str],
    quick_test_session_id: Optional[str],
    search: Optional[str],
):
    if modality:
        q = q.filter(sb_models.SandboxSample.modality == modality)
    if context_versions:
        # 'default' in the API maps to NULL in the DB
        clauses = []
        for cv in context_versions:
            if cv == "default":
                clauses.append(sb_models.SandboxSample.context_version.is_(None))
            else:
                clauses.append(sb_models.SandboxSample.context_version == cv)
        from sqlalchemy import or_

        q = q.filter(or_(*clauses))
    if modes:
        q = q.filter(sb_models.SandboxSample.mode.in_(modes))
    if models:
        q = q.filter(sb_models.SandboxSample.model.in_(models))
    if providers:
        q = q.filter(sb_models.SandboxSample.provider.in_(providers))
    if use_guidance is not None:
        q = q.filter(sb_models.SandboxSample.use_guidance == use_guidance)
    if use_parents is not None:
        q = q.filter(sb_models.SandboxSample.use_parents == use_parents)
    if date_from:
        q = q.filter(sb_models.SandboxSample.created_at >= date_from)
    if date_to:
        q = q.filter(sb_models.SandboxSample.created_at <= date_to)
    if prompt_contains:
        like = f"%{prompt_contains}%"
        q = q.filter(sb_models.SandboxSample.prompt.ilike(like))
    if job_id:
        q = q.filter(sb_models.SandboxSample.job_id == job_id)
    if quick_test_session_id:
        q = q.filter(sb_models.SandboxSample.quick_test_session_id == quick_test_session_id)
    if search:
        like = f"%{search}%"
        from sqlalchemy import or_

        q = q.filter(
            or_(
                sb_models.SandboxSample.code.ilike(like),
                sb_models.SandboxSample.prompt.ilike(like),
                sb_models.SandboxSample.model.ilike(like),
            )
        )
    return q


@router.get("/samples", response_model=SampleListResponse)
async def list_samples(
    modality: Optional[str] = Query(default=None),
    context_version: list[str] = Query(default=[]),
    mode: list[str] = Query(default=[]),
    model: list[str] = Query(default=[]),
    provider: list[str] = Query(default=[]),
    use_guidance: Optional[bool] = Query(default=None),
    use_parents: Optional[bool] = Query(default=None),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    prompt_contains: Optional[str] = Query(default=None),
    job_id: Optional[str] = Query(default=None),
    quick_test_session_id: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=24, ge=1, le=200),
    order_by: str = Query(default="created_desc"),
    db: DBSession = Depends(get_sandbox_db),
):
    q = db.query(sb_models.SandboxSample)
    q = _apply_filters(
        q,
        modality=modality,
        context_versions=context_version,
        modes=mode,
        models=model,
        providers=provider,
        use_guidance=use_guidance,
        use_parents=use_parents,
        date_from=date_from,
        date_to=date_to,
        prompt_contains=prompt_contains,
        job_id=job_id,
        quick_test_session_id=quick_test_session_id,
        search=search,
    )

    total = q.count()

    if order_by == "created_asc":
        q = q.order_by(sb_models.SandboxSample.created_at.asc())
    else:
        q = q.order_by(sb_models.SandboxSample.created_at.desc())

    rows = q.offset((page - 1) * per_page).limit(per_page).all()
    return SampleListResponse(
        items=[SampleItem.model_validate(r) for r in rows],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/samples/stats", response_model=SamplesStats)
async def samples_stats(
    modality: Optional[str] = Query(default=None),
    context_version: list[str] = Query(default=[]),
    mode: list[str] = Query(default=[]),
    model: list[str] = Query(default=[]),
    provider: list[str] = Query(default=[]),
    use_guidance: Optional[bool] = Query(default=None),
    use_parents: Optional[bool] = Query(default=None),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    db: DBSession = Depends(get_sandbox_db),
):
    def base():
        q = db.query(sb_models.SandboxSample)
        return _apply_filters(
            q,
            modality=modality,
            context_versions=context_version,
            modes=mode,
            models=model,
            providers=provider,
            use_guidance=use_guidance,
            use_parents=use_parents,
            date_from=date_from,
            date_to=date_to,
            prompt_contains=None,
            job_id=None,
            quick_test_session_id=None,
            search=None,
        )

    total = base().count()
    now = datetime.now(timezone.utc)
    total_24h = base().filter(sb_models.SandboxSample.created_at >= now - timedelta(hours=24)).count()
    total_7d = base().filter(sb_models.SandboxSample.created_at >= now - timedelta(days=7)).count()

    avg_len = db.query(func.coalesce(func.avg(func.length(sb_models.SandboxSample.code)), 0.0))
    avg_len = _apply_filters(
        avg_len.select_from(sb_models.SandboxSample),
        modality=modality,
        context_versions=context_version,
        modes=mode,
        models=model,
        providers=provider,
        use_guidance=use_guidance,
        use_parents=use_parents,
        date_from=date_from,
        date_to=date_to,
        prompt_contains=None,
        job_id=None,
        quick_test_session_id=None,
        search=None,
    )
    avg_code_length = float(avg_len.scalar() or 0.0)

    avg_lat_q = db.query(func.avg(sb_models.SandboxSample.latency_ms))
    avg_lat_q = _apply_filters(
        avg_lat_q.select_from(sb_models.SandboxSample),
        modality=modality,
        context_versions=context_version,
        modes=mode,
        models=model,
        providers=provider,
        use_guidance=use_guidance,
        use_parents=use_parents,
        date_from=date_from,
        date_to=date_to,
        prompt_contains=None,
        job_id=None,
        quick_test_session_id=None,
        search=None,
    )
    avg_latency_raw = avg_lat_q.scalar()
    avg_latency_ms = float(avg_latency_raw) if avg_latency_raw is not None else None

    def bucket(col, label_expr=None) -> list[StatsBucket]:
        label_expr = label_expr if label_expr is not None else col
        q = db.query(label_expr, func.count())
        q = _apply_filters(
            q.select_from(sb_models.SandboxSample),
            modality=modality,
            context_versions=context_version,
            modes=mode,
            models=model,
            providers=provider,
            use_guidance=use_guidance,
            use_parents=use_parents,
            date_from=date_from,
            date_to=date_to,
            prompt_contains=None,
            job_id=None,
            quick_test_session_id=None,
            search=None,
        )
        q = q.group_by(label_expr).order_by(func.count().desc())
        return [StatsBucket(key=str(k) if k is not None else "default", count=int(c)) for k, c in q.all()]

    by_modality = bucket(sb_models.SandboxSample.modality)
    cv_label = case(
        (sb_models.SandboxSample.context_version.is_(None), "default"),
        else_=sb_models.SandboxSample.context_version,
    )
    by_context_version = bucket(sb_models.SandboxSample.context_version, cv_label)
    by_model = bucket(sb_models.SandboxSample.model)
    by_mode = bucket(sb_models.SandboxSample.mode)

    day_label = func.strftime("%Y-%m-%d", sb_models.SandboxSample.created_at)
    by_day_q = db.query(day_label, func.count())
    by_day_q = _apply_filters(
        by_day_q.select_from(sb_models.SandboxSample),
        modality=modality,
        context_versions=context_version,
        modes=mode,
        models=model,
        providers=provider,
        use_guidance=use_guidance,
        use_parents=use_parents,
        date_from=date_from,
        date_to=date_to,
        prompt_contains=None,
        job_id=None,
        quick_test_session_id=None,
        search=None,
    )
    by_day_q = by_day_q.group_by(day_label).order_by(day_label.asc())
    by_day = [TimeBucket(date=str(d), count=int(c)) for d, c in by_day_q.all() if d is not None]

    # by_day_by_version: stacked chart data
    by_day_by_version_q = db.query(day_label, cv_label, func.count())
    by_day_by_version_q = _apply_filters(
        by_day_by_version_q.select_from(sb_models.SandboxSample),
        modality=modality,
        context_versions=context_version,
        modes=mode,
        models=model,
        providers=provider,
        use_guidance=use_guidance,
        use_parents=use_parents,
        date_from=date_from,
        date_to=date_to,
        prompt_contains=None,
        job_id=None,
        quick_test_session_id=None,
        search=None,
    )
    by_day_by_version_q = by_day_by_version_q.group_by(day_label, cv_label).order_by(day_label.asc())
    by_day_by_version: list[dict] = []
    pivot: dict[str, dict] = {}
    for d, ver, c in by_day_by_version_q.all():
        if d is None:
            continue
        ds = str(d)
        ver_key = str(ver) if ver is not None else "default"
        if ds not in pivot:
            pivot[ds] = {"date": ds}
            by_day_by_version.append(pivot[ds])
        pivot[ds][ver_key] = int(c)

    return SamplesStats(
        total=int(total),
        total_last_24h=int(total_24h),
        total_last_7d=int(total_7d),
        avg_code_length=float(avg_code_length),
        avg_latency_ms=avg_latency_ms,
        by_modality=by_modality,
        by_context_version=by_context_version,
        by_model=by_model,
        by_mode=by_mode,
        by_day=by_day,
        by_day_by_version=by_day_by_version,
    )


@router.get("/samples/{sample_id}", response_model=SampleItem)
async def get_sample(sample_id: str, db: DBSession = Depends(get_sandbox_db)):
    row = (
        db.query(sb_models.SandboxSample)
        .filter(sb_models.SandboxSample.id == sample_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Sample not found")
    return SampleItem.model_validate(row)


@router.delete("/samples/{sample_id}")
async def delete_sample(sample_id: str, db: DBSession = Depends(get_sandbox_db)):
    row = (
        db.query(sb_models.SandboxSample)
        .filter(sb_models.SandboxSample.id == sample_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Sample not found")
    db.delete(row)
    db.commit()
    return {"status": "deleted"}


@router.get("/samples/distinct/{field}")
async def distinct_values(
    field: str,
    modality: Optional[str] = Query(default=None),
    db: DBSession = Depends(get_sandbox_db),
):
    """Quick helper for filter dropdowns: distinct values of {model, provider, context_version, mode}."""
    if field not in {"model", "provider", "context_version", "mode"}:
        raise HTTPException(status_code=400, detail="invalid field")
    col = getattr(sb_models.SandboxSample, field)
    q = db.query(col).distinct()
    if modality:
        q = q.filter(sb_models.SandboxSample.modality == modality)
    values = [r[0] for r in q.all()]
    if field == "context_version":
        values = sorted(("default" if v is None else v for v in values))
    else:
        values = sorted([v for v in values if v is not None])
    return {"field": field, "values": values}
