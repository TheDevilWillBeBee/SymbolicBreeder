"""Prompt / guidance library (per modality) — /api/sandbox/prompts/..."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from .. import models as sb_models
from ..database import get_sandbox_db
from ..schemas import PromptCreate, PromptItem, PromptUpdate

router = APIRouter(prefix="/sandbox", tags=["sandbox-prompts"])


@router.get("/prompts/{modality}", response_model=list[PromptItem])
async def list_prompts(modality: str, db: DBSession = Depends(get_sandbox_db)):
    rows = (
        db.query(sb_models.SandboxPrompt)
        .filter(sb_models.SandboxPrompt.modality == modality)
        .order_by(sb_models.SandboxPrompt.created_at.desc())
        .all()
    )
    return [PromptItem.model_validate(r) for r in rows]


@router.post("/prompts/{modality}", response_model=PromptItem)
async def create_prompt(modality: str, body: PromptCreate, db: DBSession = Depends(get_sandbox_db)):
    row = sb_models.SandboxPrompt(modality=modality, label=body.label, text=body.text)
    db.add(row)
    db.commit()
    db.refresh(row)
    return PromptItem.model_validate(row)


@router.put("/prompts/{modality}/{prompt_id}", response_model=PromptItem)
async def update_prompt(
    modality: str, prompt_id: str, body: PromptUpdate, db: DBSession = Depends(get_sandbox_db)
):
    row = (
        db.query(sb_models.SandboxPrompt)
        .filter(sb_models.SandboxPrompt.id == prompt_id, sb_models.SandboxPrompt.modality == modality)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Prompt not found")
    if body.label is not None:
        row.label = body.label
    if body.text is not None:
        row.text = body.text
    db.commit()
    db.refresh(row)
    return PromptItem.model_validate(row)


@router.delete("/prompts/{modality}/{prompt_id}")
async def delete_prompt(modality: str, prompt_id: str, db: DBSession = Depends(get_sandbox_db)):
    row = (
        db.query(sb_models.SandboxPrompt)
        .filter(sb_models.SandboxPrompt.id == prompt_id, sb_models.SandboxPrompt.modality == modality)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Prompt not found")
    db.delete(row)
    db.commit()
    return {"status": "deleted"}
