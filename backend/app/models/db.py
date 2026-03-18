import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)

from ..database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    external_id = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=True, unique=True)
    display_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, default="Untitled Session")
    modality = Column(String, nullable=False, default="strudel")
    context_profile = Column(String, nullable=True, default="intermediate")
    owner_user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=_now)


class Program(Base):
    __tablename__ = "programs"

    id = Column(String, primary_key=True, default=_uuid)
    code = Column(Text, nullable=False)
    modality = Column(String, nullable=False, default="strudel")
    generation = Column(Integer, default=0)
    parent_ids = Column(JSON, default=list)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False, index=True)
    creator_user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=_now)


class SharedProgram(Base):
    __tablename__ = "shared_programs"

    id = Column(String, primary_key=True, default=_uuid)
    program_id = Column(String, ForeignKey("programs.id"), nullable=True, index=True)
    sharer_name = Column(String, nullable=False)
    modality = Column(String, nullable=False)
    code = Column(Text, nullable=False)
    lineage = Column(JSON, default=list)
    llm_model = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)


class ProgramReaction(Base):
    __tablename__ = "program_reactions"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    program_id = Column(String, ForeignKey("programs.id"), nullable=False, index=True)
    reaction = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    __table_args__ = (
        UniqueConstraint("user_id", "program_id", name="uq_program_reactions_user_program"),
        CheckConstraint("reaction IN (-1, 1)", name="ck_program_reactions_reaction_value"),
    )
