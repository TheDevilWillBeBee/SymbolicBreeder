"""Evolution orchestration – creates programs via the LLM service and persists them."""

import uuid
from typing import Optional

from sqlalchemy.orm import Session as DBSession

from ..models import db as models
from ..models.schemas import EvolveResponse, ParentProgram, ProgramResponse
from .llm import generate_programs


def _id() -> str:
    return str(uuid.uuid4())


def _ensure_session(session_id: Optional[str], modality: str, db: DBSession) -> str:
    """Return session_id, creating a new Session row if one wasn't provided."""
    if not session_id:
        session_id = _id()
        db.add(models.Session(id=session_id, name="Untitled Session", modality=modality))
        db.flush()
    return session_id


def _next_generation(session_id: str, db: DBSession) -> int:
    """Return the next generation number for a session (max existing + 1, or 1)."""
    row = (
        db.query(models.Program.generation)
        .filter(models.Program.session_id == session_id)
        .order_by(models.Program.generation.desc())
        .first()
    )
    return (row[0] + 1) if row else 1


def _persist_programs(
    codes: list[str],
    modality: str,
    generation: int,
    parent_ids: list[str],
    session_id: str,
    db: DBSession,
) -> list[models.Program]:
    """Insert Program rows for each generated code string and commit."""
    programs: list[models.Program] = []
    for code in codes:
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
    # Refresh each row so that server-generated fields (created_at, etc.) are
    # populated before we serialize and return them to the caller.
    for p in programs:
        db.refresh(p)
    return programs


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
    programs = _persist_programs(
        result.codes, modality, generation=0, parent_ids=[], session_id=session_id, db=db
    )
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
    session_id = _ensure_session(session_id, modality, db)

    parent_codes = [p.code for p in parents]
    parent_ids = [p.id for p in parents]
    generation = _next_generation(session_id, db)

    result = await generate_programs(
        modality, parent_codes, population_size, guidance,
        provider_key=provider_key, model=model, api_key=api_key, base_url=base_url,
        context_profile=context_profile,
    )
    programs = _persist_programs(
        result.codes, modality, generation, parent_ids, session_id, db
    )

    return EvolveResponse(
        programs=[ProgramResponse.model_validate(p) for p in programs],
        generation=generation,
        source=result.source,
        message=result.message,
    )
