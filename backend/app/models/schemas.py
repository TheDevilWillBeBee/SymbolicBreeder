from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


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
    population_size: int = Field(default=6, ge=1, le=6)
    session_id: Optional[str] = None
    provider: str = "anthropic"
    model: str = "claude-sonnet-4-20250514"
    base_url: Optional[str] = None
    context_profile: str = "intermediate"
    context_version: Optional[str] = None


class EvolveResponse(BaseModel):
    programs: list[ProgramResponse]
    generation: int
    source: str = "llm"
    message: Optional[str] = None


class PromptRequest(BaseModel):
    modality: str = "strudel"
    parents: list[ParentProgram] = []
    guidance: Optional[str] = None
    population_size: int = Field(default=6, ge=1, le=6)
    context_profile: str = "intermediate"
    context_version: Optional[str] = None


class PromptResponse(BaseModel):
    system: str
    user: str
    combined: str


class LineageProgramSchema(BaseModel):
    id: str
    code: str
    original_code: Optional[str] = Field(default=None, alias="originalCode")
    customized_code: Optional[str] = Field(default=None, alias="customizedCode")
    modality: str
    generation: int
    parentIds: list[str] = Field(default_factory=list, alias="parentIds")
    guidance: Optional[str] = None
    llm_model: Optional[str] = Field(default=None, alias="llmModel")
    context_profile: Optional[str] = Field(default=None, alias="contextProfile")
    gallery_origin_id: Optional[str] = Field(default=None, alias="galleryOriginId")
    gallery_origin_name: Optional[str] = Field(default=None, alias="galleryOriginName")

    model_config = {"populate_by_name": True}


class ShareProgramRequest(BaseModel):
    program_id: Optional[str] = None
    sharer_name: Optional[str] = None  # optional — derived from auth user when logged in
    code: str
    modality: str
    lineage: list[LineageProgramSchema] = []
    llm_model: Optional[str] = None


class SharedProgramResponse(BaseModel):
    id: str
    program_id: Optional[str] = None
    sharer_name: str
    sharer_user_id: Optional[str] = None
    modality: str
    code: str
    lineage: list[dict] = []
    llm_model: Optional[str] = None
    like_count: int = 0
    liked_by_me: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class SharedProgramListResponse(BaseModel):
    items: list[SharedProgramResponse]
    total: int
    page: int
    per_page: int


# ---------------------------------------------------------------------------
# Auth schemas
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_-]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterStartResponse(BaseModel):
    challenge_id: str
    email: EmailStr
    expires_in_seconds: int
    resend_after_seconds: int


class RegisterVerifyRequest(BaseModel):
    challenge_id: str
    code: str = Field(min_length=4, max_length=8, pattern=r"^[0-9]+$")


class RegisterResendRequest(BaseModel):
    challenge_id: str


class RegisterResendResponse(BaseModel):
    challenge_id: str
    expires_in_seconds: int
    resend_after_seconds: int


class LoginRequest(BaseModel):
    login: str  # accepts email or username
    password: str


class UserResponse(BaseModel):
    id: str
    username: Optional[str] = None
    email: Optional[str] = None
    is_verified: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LikeResponse(BaseModel):
    shared_program_id: str
    liked: bool
    like_count: int


class CreateSessionRequest(BaseModel):
    modality: str = "strudel"
    name: Optional[str] = "Untitled Session"
    prompt: Optional[str] = None
    population_size: int = Field(default=6, ge=1, le=6)
    provider: str = "anthropic"
    model: str = "claude-sonnet-4-20250514"
    base_url: Optional[str] = None
    context_profile: str = "intermediate"
    context_version: Optional[str] = None
    population_size: int = Field(default=6, ge=1, le=20)


class SessionResponse(BaseModel):
    id: str
    name: str
    modality: str
    created_at: datetime
    programs: list[ProgramResponse] = []
    source: str = "llm"
    message: Optional[str] = None

    model_config = {"from_attributes": True}
