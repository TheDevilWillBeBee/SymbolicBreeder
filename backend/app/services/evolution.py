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
    provider_key: str = "anthropic",
    model: str = "claude-sonnet-4-20250514",
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    context_profile: str = "intermediate",
) -> tuple[list[models.Program], str, str | None]:
    """Create generation-0 programs for a brand-new session.

    Returns (programs, source, message).
    """
    result = await generate_programs(
        modality, [], population_size=6, guidance=guidance,
        provider_key=provider_key, model=model, api_key=api_key, base_url=base_url,
        context_profile=context_profile,
    )

    programs: list[models.Program] = []
    for code in result.codes:
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
    return programs, result.source, result.message


async def evolve_programs(
    modality: str,
    parents: list[ParentProgram],
    guidance: Optional[str],
    population_size: int,
    session_id: Optional[str],
    db: DBSession,
    provider_key: str = "anthropic",
    model: str = "claude-sonnet-4-20250514",
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    context_profile: str = "intermediate",
) -> EvolveResponse:
    """Evolve the next generation from selected parents."""
    if not session_id:
        session_id = _id()
        db.add(
            models.Session(
                id=session_id,
                name="Untitled Session",
                modality=modality,
            )
        )
        db.flush()

    parent_codes = [p.code for p in parents]
    parent_ids = [p.id for p in parents]

    # Determine next generation number
    generation = 1
    row = (
        db.query(models.Program.generation)
        .filter(models.Program.session_id == session_id)
        .order_by(models.Program.generation.desc())
        .first()
    )
    if row:
        generation = row[0] + 1

    result = await generate_programs(
        modality, parent_codes, population_size, guidance,
        provider_key=provider_key, model=model, api_key=api_key, base_url=base_url,
        context_profile=context_profile,
    )

    programs: list[models.Program] = []
    for code in result.codes:
        program = models.Program(
            id=_id(),
            code=code,
            modality=modality,
            generation=generation,
            parent_ids=parent_ids,
            session_id=session_id,
        )
        db.add(program)
        programs.append(program)

    db.commit()
    for p in programs:
        db.refresh(p)

    return EvolveResponse(
        programs=[ProgramResponse.model_validate(p) for p in programs],
        generation=generation,
        source=result.source,
        message=result.message,
    )
