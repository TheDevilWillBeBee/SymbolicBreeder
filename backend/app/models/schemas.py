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
    provider: str = "anthropic"
    model: str = "claude-sonnet-4-20250514"
    base_url: Optional[str] = None


class EvolveResponse(BaseModel):
    programs: list[ProgramResponse]
    generation: int
    source: str = "llm"
    message: Optional[str] = None


class LineageProgramSchema(BaseModel):
    id: str
    code: str
    modality: str
    generation: int
    parentIds: list[str] = Field(default_factory=list, alias="parentIds")

    model_config = {"populate_by_name": True}


class ShareProgramRequest(BaseModel):
    program_id: Optional[str] = None
    sharer_name: str
    code: str
    modality: str
    lineage: list[LineageProgramSchema] = []
    llm_model: Optional[str] = None


class SharedProgramResponse(BaseModel):
    id: str
    program_id: Optional[str] = None
    sharer_name: str
    modality: str
    code: str
    lineage: list[dict] = []
    llm_model: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SharedProgramListResponse(BaseModel):
    items: list[SharedProgramResponse]
    total: int
    page: int
    per_page: int


class CreateSessionRequest(BaseModel):
    modality: str = "strudel"
    name: Optional[str] = "Untitled Session"
    prompt: Optional[str] = None
    provider: str = "anthropic"
    model: str = "claude-sonnet-4-20250514"
    base_url: Optional[str] = None


class SessionResponse(BaseModel):
    id: str
    name: str
    modality: str
    created_at: datetime
    programs: list[ProgramResponse] = []
    source: str = "llm"
    message: Optional[str] = None

    model_config = {"from_attributes": True}
