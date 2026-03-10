from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ParentProgram(BaseModel):
    id: str
    code: str


class ProgramResponse(BaseModel):
    id: str
    code: str
    modality: str
    generation: int
    parent_ids: list[str]
    session_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class EvolveRequest(BaseModel):
    modality: str = "strudel"
    parents: list[ParentProgram]
    guidance: Optional[str] = None
    population_size: int = Field(default=6, ge=1, le=20)
    session_id: Optional[str] = None


class EvolveResponse(BaseModel):
    programs: list[ProgramResponse]
    generation: int


class CreateSessionRequest(BaseModel):
    modality: str = "strudel"
    name: Optional[str] = "Untitled Session"
    prompt: Optional[str] = None


class SessionResponse(BaseModel):
    id: str
    name: str
    modality: str
    created_at: datetime
    programs: list[ProgramResponse] = []

    model_config = {"from_attributes": True}
