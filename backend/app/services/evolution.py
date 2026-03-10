"""Evolution orchestration – creates programs via the LLM service and persists them."""

import uuid
from typing import Optional

from sqlalchemy.orm import Session as DBSession

from ..models import db as models
from ..models.schemas import EvolveResponse, ParentProgram, ProgramResponse
from .llm import generate_programs


def _id() -> str:
    return str(uuid.uuid4())


async def create_seed_generation(
    session_id: str,
    modality: str,
    db: DBSession,
    guidance: Optional[str] = None,
) -> list[models.Program]:
    """Create generation-0 programs for a brand-new session."""
    codes = await generate_programs(modality, [], population_size=6, guidance=guidance)

    programs: list[models.Program] = []
    for code in codes:
        program = models.Program(
            id=_id(),
            code=code,
            modality=modality,
            generation=0,
            parent_ids=[],
            session_id=session_id,
        )
        db.add(program)
        programs.append(program)

    db.commit()
    for p in programs:
        db.refresh(p)
    return programs


async def evolve_programs(
    modality: str,
    parents: list[ParentProgram],
    guidance: Optional[str],
    population_size: int,
    session_id: Optional[str],
    db: DBSession,
) -> EvolveResponse:
    """Evolve the next generation from selected parents."""
    parent_codes = [p.code for p in parents]
    parent_ids = [p.id for p in parents]

    # Determine next generation number
    generation = 1
    if session_id:
        row = (
            db.query(models.Program.generation)
            .filter(models.Program.session_id == session_id)
            .order_by(models.Program.generation.desc())
            .first()
        )
        if row:
            generation = row[0] + 1

    codes = await generate_programs(modality, parent_codes, population_size, guidance)

    programs: list[models.Program] = []
    for code in codes:
        program = models.Program(
            id=_id(),
            code=code,
            modality=modality,
            generation=generation,
            parent_ids=parent_ids,
            session_id=session_id or _id(),
        )
        db.add(program)
        programs.append(program)

    db.commit()
    for p in programs:
        db.refresh(p)

    return EvolveResponse(
        programs=[ProgramResponse.model_validate(p) for p in programs],
        generation=generation,
    )
