"""ORM models for the sandbox SQLite database."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)

from .database import SandboxBase


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class SandboxJob(SandboxBase):
    """A background generation job: produce N samples for (modality, context_version, mode)."""

    __tablename__ = "sandbox_jobs"

    id = Column(String, primary_key=True, default=_uuid)
    label = Column(String, nullable=True)
    modality = Column(String, nullable=False, index=True)
    context_version = Column(String, nullable=True, index=True)
    context_profile = Column(String, nullable=False, default="intermediate")
    mode = Column(String, nullable=False, default="seed")  # "seed" | "evolve"
    use_guidance = Column(Boolean, nullable=False, default=False)
    use_parents = Column(Boolean, nullable=False, default=False)
    parents_per_sample = Column(Integer, nullable=False, default=1)
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    base_url = Column(String, nullable=True)

    target_count = Column(Integer, nullable=False, default=0)
    completed_count = Column(Integer, nullable=False, default=0)
    failed_count = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="pending", index=True)
    # status values: pending, running, done, failed, cancelled, interrupted

    prompt_pool = Column(JSON, nullable=False, default=list)  # list[str]
    parent_pool = Column(JSON, nullable=False, default=list)  # list[{id, code, label?}]

    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)

    __table_args__ = (
        Index("ix_sandbox_jobs_mod_created", "modality", "created_at"),
    )


class SandboxSample(SandboxBase):
    """A single generated program, with full annotations."""

    __tablename__ = "sandbox_samples"

    id = Column(String, primary_key=True, default=_uuid)
    job_id = Column(String, ForeignKey("sandbox_jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    quick_test_session_id = Column(String, nullable=True, index=True)

    modality = Column(String, nullable=False, index=True)
    context_version = Column(String, nullable=True, index=True)
    context_profile = Column(String, nullable=False, default="intermediate")
    mode = Column(String, nullable=False, default="seed")
    use_guidance = Column(Boolean, nullable=False, default=False)
    use_parents = Column(Boolean, nullable=False, default=False)

    provider = Column(String, nullable=False)
    model = Column(String, nullable=False, index=True)
    base_url = Column(String, nullable=True)

    prompt = Column(Text, nullable=True)  # The guidance text (if any)
    prompt_flat = Column(Text, nullable=True)  # Final flattened LLM prompt
    parents_json = Column(JSON, nullable=False, default=list)  # [{id, code, label?}]
    code = Column(Text, nullable=False, default="")
    error = Column(Text, nullable=True)

    latency_ms = Column(Integer, nullable=True)
    source = Column(String, nullable=False, default="llm")  # "llm" | "mock"
    created_at = Column(DateTime, default=_now, nullable=False, index=True)

    __table_args__ = (
        Index("ix_sandbox_samples_mod_ver_created", "modality", "context_version", "created_at"),
    )


class SandboxParent(SandboxBase):
    """A reusable parent program kept in the per-modality library."""

    __tablename__ = "sandbox_parents"

    id = Column(String, primary_key=True, default=_uuid)
    modality = Column(String, nullable=False, index=True)
    label = Column(String, nullable=False)
    code = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)


class SandboxPrompt(SandboxBase):
    """A reusable guidance/seed prompt kept in the per-modality library."""

    __tablename__ = "sandbox_prompts"

    id = Column(String, primary_key=True, default=_uuid)
    modality = Column(String, nullable=False, index=True)
    label = Column(String, nullable=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=_now, nullable=False)
    updated_at = Column(DateTime, default=_now, onupdate=_now, nullable=False)
