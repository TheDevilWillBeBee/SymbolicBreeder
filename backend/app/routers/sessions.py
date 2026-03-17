from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session as DBSession

from ..database import get_db
from ..models import db as models
from ..models.schemas import CreateSessionRequest, SessionResponse, ProgramResponse
from ..services.evolution import create_seed_generation

router = APIRouter()


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    request: CreateSessionRequest,
    db: DBSession = Depends(get_db),
    x_api_key: str | None = Header(default=None),
):
    session = models.Session(
        name=request.name or "Untitled Session",
        modality=request.modality,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    programs, source, message = await create_seed_generation(
        session.id,
        modality=request.modality,
        db=db,
        guidance=request.prompt,
        provider_key=request.provider,
        model=request.model,
        api_key=x_api_key,
        base_url=request.base_url,
    )

    return SessionResponse(
        id=session.id,
        name=session.name,
        modality=session.modality,
        created_at=session.created_at,
        programs=[ProgramResponse.model_validate(p) for p in programs],
        source=source,
        message=message,
    )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    programs = (
        db.query(models.Program)
        .filter(models.Program.session_id == session_id)
        .order_by(models.Program.generation, models.Program.created_at)
        .all()
    )

    return SessionResponse(
        id=session.id,
        name=session.name,
        modality=session.modality,
        created_at=session.created_at,
        programs=[ProgramResponse.model_validate(p) for p in programs],
    )


@router.get("/programs/{program_id}", response_model=ProgramResponse)
async def get_program(program_id: str, db: DBSession = Depends(get_db)):
    program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return ProgramResponse.model_validate(program)
