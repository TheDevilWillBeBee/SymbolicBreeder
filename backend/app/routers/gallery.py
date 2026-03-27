from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session as DBSession

from ..auth import get_current_user, get_optional_user, get_verified_user
from ..database import get_db
from ..models.db import ProgramReaction, SharedProgram, User
from ..models.schemas import (
    LikeResponse,
    ShareProgramRequest,
    SharedProgramListResponse,
    SharedProgramResponse,
)

router = APIRouter(tags=["gallery"])


class GallerySortBy(str, Enum):
    newest = "newest"
    most_liked = "most_liked"


def _to_response(row: SharedProgram, liked_ids: set[str] | None = None) -> SharedProgramResponse:
    resp = SharedProgramResponse.model_validate(row)
    if liked_ids and row.id in liked_ids:
        resp.liked_by_me = True
    return resp


@router.post("/gallery/share", response_model=SharedProgramResponse)
async def share_program(
    req: ShareProgramRequest,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    shared = SharedProgram(
        program_id=req.program_id,
        sharer_name=user.username or user.display_name or "Anonymous",
        sharer_user_id=user.id,
        modality=req.modality,
        code=req.code,
        lineage=[lp.model_dump(by_alias=True) for lp in req.lineage],
        llm_model=req.llm_model,
    )
    db.add(shared)
    db.commit()
    db.refresh(shared)
    return SharedProgramResponse.model_validate(shared)


@router.get("/gallery/programs", response_model=SharedProgramListResponse)
async def list_shared_programs(
    modality: str = Query("shader"),
    sort_by: GallerySortBy = Query(GallerySortBy.newest),
    user_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: DBSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    base = select(SharedProgram).where(SharedProgram.modality == modality)

    if user_id:
        base = base.where(SharedProgram.sharer_user_id == user_id)

    total = db.scalar(select(func.count()).select_from(base.subquery()))

    if sort_by == GallerySortBy.most_liked:
        order = (SharedProgram.like_count.desc(), SharedProgram.created_at.desc())
    else:
        order = (SharedProgram.created_at.desc(),)

    rows = (
        db.execute(base.order_by(*order).offset((page - 1) * per_page).limit(per_page))
        .scalars()
        .all()
    )

    # Batch-fetch liked_by_me for current user
    liked_ids: set[str] = set()
    if current_user and rows:
        row_ids = [r.id for r in rows]
        liked_rows = db.execute(
            select(ProgramReaction.shared_program_id).where(
                ProgramReaction.user_id == current_user.id,
                ProgramReaction.shared_program_id.in_(row_ids),
                ProgramReaction.reaction == 1,
            )
        ).scalars().all()
        liked_ids = set(liked_rows)

    return SharedProgramListResponse(
        items=[_to_response(r, liked_ids) for r in rows],
        total=total or 0,
        page=page,
        per_page=per_page,
    )


@router.get("/gallery/programs/{program_id}", response_model=SharedProgramResponse)
async def get_shared_program(
    program_id: str,
    db: DBSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    row = db.get(SharedProgram, program_id)
    if not row:
        raise HTTPException(status_code=404, detail="Shared program not found")

    liked_ids: set[str] = set()
    if current_user:
        existing = db.execute(
            select(ProgramReaction.shared_program_id).where(
                ProgramReaction.user_id == current_user.id,
                ProgramReaction.shared_program_id == program_id,
                ProgramReaction.reaction == 1,
            )
        ).scalar_one_or_none()
        if existing:
            liked_ids.add(existing)

    return _to_response(row, liked_ids)


@router.post("/gallery/programs/{shared_program_id}/like", response_model=LikeResponse)
async def toggle_like(
    shared_program_id: str,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    shared = db.get(SharedProgram, shared_program_id)
    if not shared:
        raise HTTPException(status_code=404, detail="Shared program not found")

    existing = db.execute(
        select(ProgramReaction).where(
            ProgramReaction.user_id == user.id,
            ProgramReaction.shared_program_id == shared_program_id,
        )
    ).scalar_one_or_none()

    if existing:
        db.delete(existing)
        shared.like_count = max(0, (shared.like_count or 0) - 1)
        liked = False
    else:
        reaction = ProgramReaction(
            user_id=user.id,
            shared_program_id=shared_program_id,
            reaction=1,
        )
        db.add(reaction)
        shared.like_count = (shared.like_count or 0) + 1
        liked = True

    db.commit()
    db.refresh(shared)
    return LikeResponse(
        shared_program_id=shared_program_id,
        liked=liked,
        like_count=shared.like_count,
    )
