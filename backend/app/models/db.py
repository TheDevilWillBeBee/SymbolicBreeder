import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, JSON, String, Text

from ..database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, default="Untitled Session")
    modality = Column(String, nullable=False, default="strudel")
    created_at = Column(DateTime, default=_now)


class Program(Base):
    __tablename__ = "programs"

    id = Column(String, primary_key=True, default=_uuid)
    code = Column(Text, nullable=False)
    modality = Column(String, nullable=False, default="strudel")
    generation = Column(Integer, default=0)
    parent_ids = Column(JSON, default=list)
    session_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=_now)
