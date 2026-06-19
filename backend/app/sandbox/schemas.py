"""Pydantic schemas for the sandbox API."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


# ── Contexts ──


class SourceFile(BaseModel):
    id: str
    path: str
    text: str
    inject_into: list[str] = []
    enabled: bool = True
    level: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None


class PromptBundle(BaseModel):
    role: str = ""
    seed_prompt: str = ""
    evolve_prompt: str = ""
    variety_suffix: str = ""
    raw_yaml: Optional[str] = None


class ContextManifest(BaseModel):
    version: int = 1
    modality: str
    default_profile: str = "intermediate"
    profiles: dict[str, dict[str, Any]] = {}
    sources: list[dict[str, Any]] = []
    prompt_bundle: dict[str, Any] = {}
    extends_manifest: Optional[str] = None
    raw_yaml: Optional[str] = None


class ContextVersionSummary(BaseModel):
    modality: str
    version: str
    label: Optional[str] = None
    description: Optional[str] = None
    file_count: int = 0
    source_count: int = 0
    last_modified: Optional[datetime] = None
    is_app_default: bool = False


class ContextVersionDetail(BaseModel):
    modality: str
    version: str
    is_app_default: bool = False
    manifest: ContextManifest
    prompt_bundle: PromptBundle
    sources: list[SourceFile]


class ContextDuplicateRequest(BaseModel):
    source_version: str = "default"
    new_label: Optional[str] = None


class ContextUpdateRequest(BaseModel):
    manifest: Optional[ContextManifest] = None
    prompt_bundle: Optional[PromptBundle] = None
    sources: Optional[list[SourceFile]] = None


# ── Parents / Prompts library ──


class ParentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    modality: str
    label: str
    code: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ParentCreate(BaseModel):
    label: str
    code: str
    notes: Optional[str] = None


class ParentUpdate(BaseModel):
    label: Optional[str] = None
    code: Optional[str] = None
    notes: Optional[str] = None


class PromptItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    modality: str
    label: Optional[str] = None
    text: str
    created_at: datetime
    updated_at: datetime


class PromptCreate(BaseModel):
    label: Optional[str] = None
    text: str


class PromptUpdate(BaseModel):
    label: Optional[str] = None
    text: Optional[str] = None


# ── Samples ──


class SampleItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    job_id: Optional[str] = None
    quick_test_session_id: Optional[str] = None
    modality: str
    context_version: Optional[str] = None
    context_profile: str
    mode: str
    use_guidance: bool
    use_parents: bool
    provider: str
    model: str
    base_url: Optional[str] = None
    prompt: Optional[str] = None
    prompt_flat: Optional[str] = None
    parents_json: list[dict[str, Any]] = []
    code: str
    error: Optional[str] = None
    latency_ms: Optional[int] = None
    source: str
    created_at: datetime


class SampleListResponse(BaseModel):
    items: list[SampleItem]
    total: int
    page: int
    per_page: int


class SampleFilters(BaseModel):
    """Documented filter shape — used in queries."""

    modality: Optional[str] = None
    context_versions: list[str] = []
    modes: list[str] = []
    models: list[str] = []
    providers: list[str] = []
    use_guidance: Optional[bool] = None
    use_parents: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    prompt_contains: Optional[str] = None
    job_id: Optional[str] = None
    quick_test_session_id: Optional[str] = None
    search: Optional[str] = None


# ── Stats ──


class StatsBucket(BaseModel):
    key: str
    count: int


class TimeBucket(BaseModel):
    date: str  # ISO date string
    count: int


class SamplesStats(BaseModel):
    total: int
    total_last_24h: int
    total_last_7d: int
    avg_code_length: float
    avg_latency_ms: Optional[float] = None
    by_modality: list[StatsBucket]
    by_context_version: list[StatsBucket]
    by_model: list[StatsBucket]
    by_mode: list[StatsBucket]
    by_day: list[TimeBucket]
    by_day_by_version: list[dict[str, Any]] = []


# ── Jobs ──


class JobItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    label: Optional[str] = None
    modality: str
    context_version: Optional[str] = None
    context_profile: str
    mode: str
    use_guidance: bool
    use_parents: bool
    parents_per_sample: int
    provider: str
    model: str
    base_url: Optional[str] = None
    target_count: int
    completed_count: int
    failed_count: int
    status: str
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    prompt_pool: list[str] = []
    parent_pool: list[dict[str, Any]] = []


class JobCreate(BaseModel):
    label: Optional[str] = None
    modality: str
    context_version: Optional[str] = None  # None or "default" => app default
    context_profile: str = "intermediate"
    mode: str = "seed"  # "seed" | "evolve"
    use_guidance: bool = False
    use_parents: bool = False
    parents_per_sample: int = Field(default=1, ge=0, le=4)
    target_count: int = Field(default=10, ge=1, le=5000)
    provider: str
    model: str
    base_url: Optional[str] = None
    prompt_pool: list[str] = []  # raw strings (added inline by user)
    parent_pool: list[dict[str, Any]] = []  # [{id?, code, label?}]


# ── Quick Test ──


class QuickTestRequest(BaseModel):
    modality: str
    context_versions: list[str] = []  # each "default" or "vN"
    context_profile: str = "intermediate"
    mode: str = "seed"
    use_guidance: bool = False
    use_parents: bool = False
    parents_per_sample: int = Field(default=1, ge=0, le=4)
    count: int = Field(default=4, ge=1, le=100)
    provider: str
    model: str
    base_url: Optional[str] = None
    prompt_pool: list[str] = []
    parent_pool: list[dict[str, Any]] = []
