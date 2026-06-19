"""Isolated SQLite engine for the sandbox.

Lives in ``backend/sandbox.db`` next to the source tree. Completely separate
from the main app's PostgreSQL engine — they never share metadata, sessions,
or connections.
"""

import os
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent

# Allow override via env var for tests / deployments; default to backend/sandbox.db.
SANDBOX_DB_PATH = Path(os.getenv("SANDBOX_DB_PATH") or (_BACKEND_ROOT / "sandbox.db"))
SANDBOX_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

SANDBOX_DATABASE_URL = f"sqlite:///{SANDBOX_DB_PATH.as_posix()}"

engine = create_engine(
    SANDBOX_DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True,
)


@event.listens_for(engine, "connect")
def _enable_sqlite_pragmas(dbapi_connection, _connection_record):  # noqa: ANN001
    """Foreign keys and WAL improve concurrent reads while jobs write samples."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.execute("PRAGMA journal_mode = WAL")
    cursor.execute("PRAGMA synchronous = NORMAL")
    cursor.close()


SandboxSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

SandboxBase = declarative_base()


def get_sandbox_db():
    """FastAPI dependency: yields a sandbox DB session and closes it after the request."""
    db = SandboxSessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_sandbox_db() -> None:
    """Create all sandbox tables if they don't yet exist."""
    from . import models  # noqa: F401  (registers tables on SandboxBase)

    SandboxBase.metadata.create_all(bind=engine)
