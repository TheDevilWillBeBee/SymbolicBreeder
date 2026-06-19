"""Parent program library (per modality) — /api/sandbox/parents/..."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from .. import models as sb_models
from ..database import get_sandbox_db
from ..schemas import ParentCreate, ParentItem, ParentUpdate

router = APIRouter(prefix="/sandbox", tags=["sandbox-parents"])


@router.get("/parents/{modality}", response_model=list[ParentItem])
async def list_parents(modality: str, db: DBSession = Depends(get_sandbox_db)):
    rows = (
        db.query(sb_models.SandboxParent)
        .filter(sb_models.SandboxParent.modality == modality)
        .order_by(sb_models.SandboxParent.created_at.desc())
        .all()
    )
    return [ParentItem.model_validate(r) for r in rows]


@router.post("/parents/{modality}", response_model=ParentItem)
async def create_parent(modality: str, body: ParentCreate, db: DBSession = Depends(get_sandbox_db)):
    row = sb_models.SandboxParent(
        modality=modality, label=body.label, code=body.code, notes=body.notes
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ParentItem.model_validate(row)


@router.put("/parents/{modality}/{parent_id}", response_model=ParentItem)
async def update_parent(
    modality: str, parent_id: str, body: ParentUpdate, db: DBSession = Depends(get_sandbox_db)
):
    row = (
        db.query(sb_models.SandboxParent)
        .filter(sb_models.SandboxParent.id == parent_id, sb_models.SandboxParent.modality == modality)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Parent not found")
    if body.label is not None:
        row.label = body.label
    if body.code is not None:
        row.code = body.code
    if body.notes is not None:
        row.notes = body.notes
    db.commit()
    db.refresh(row)
    return ParentItem.model_validate(row)


@router.delete("/parents/{modality}/{parent_id}")
async def delete_parent(modality: str, parent_id: str, db: DBSession = Depends(get_sandbox_db)):
    row = (
        db.query(sb_models.SandboxParent)
        .filter(sb_models.SandboxParent.id == parent_id, sb_models.SandboxParent.modality == modality)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Parent not found")
    db.delete(row)
    db.commit()
    return {"status": "deleted"}
