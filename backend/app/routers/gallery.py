from fastapi import APIRouter, Query
from sqlalchemy import func, select

from ..database import SessionLocal
from ..models.db import SharedProgram
from ..models.schemas import (
    ShareProgramRequest,
    SharedProgramListResponse,
    SharedProgramResponse,
)

router = APIRouter(tags=["gallery"])


@router.post("/gallery/share", response_model=SharedProgramResponse)
async def share_program(req: ShareProgramRequest):
    with SessionLocal() as db:
        shared = SharedProgram(
            program_id=req.program_id,
            sharer_name=req.sharer_name,
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
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    with SessionLocal() as db:
        base = select(SharedProgram).where(SharedProgram.modality == modality)
        total = db.scalar(
            select(func.count()).select_from(base.subquery())
        )
        rows = (
            db.execute(
                base.order_by(SharedProgram.created_at.desc())
                .offset((page - 1) * per_page)
                .limit(per_page)
            )
            .scalars()
            .all()
        )
        return SharedProgramListResponse(
            items=[SharedProgramResponse.model_validate(r) for r in rows],
            total=total or 0,
            page=page,
            per_page=per_page,
        )


@router.get("/gallery/programs/{program_id}", response_model=SharedProgramResponse)
async def get_shared_program(program_id: str):
    with SessionLocal() as db:
        row = db.get(SharedProgram, program_id)
        if not row:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Shared program not found")
        return SharedProgramResponse.model_validate(row)
