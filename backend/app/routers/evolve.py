from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session as DBSession

from ..database import get_db
from ..models.schemas import EvolveRequest, EvolveResponse
from ..services.evolution import evolve_programs

router = APIRouter()


@router.post("/evolve", response_model=EvolveResponse)
async def evolve(
    request: EvolveRequest,
    db: DBSession = Depends(get_db),
    x_api_key: str | None = Header(default=None),
):
    return await evolve_programs(
        modality=request.modality,
        parents=request.parents,
        guidance=request.guidance,
        population_size=request.population_size,
        session_id=request.session_id,
        db=db,
        provider_key=request.provider,
        model=request.model,
        api_key=x_api_key,
        base_url=request.base_url,
    )
