"""Reset session data (sessions, programs, reactions) without affecting the gallery.

Gallery shared_programs rows reference programs via a nullable FK — this script
nullifies those references before deleting, so gallery entries remain intact.

Usage:
    cd backend
    # Ensure POSTGRES_URL_NON_POOLING or DATABASE_URL is set
    python reset_sessions.py
"""

import os

os.environ["DATABASE_URL"] = os.environ.get("DATABASE_URL_UNPOOLED", os.environ.get("DATABASE_URL", ""))

from app.database import SessionLocal
from app.models.db import ProgramReaction, Program, Session, SharedProgram

with SessionLocal() as db:
    # Nullify gallery FK references so shared programs survive deletion
    updated = db.query(SharedProgram).filter(SharedProgram.program_id.isnot(None)).update(
        {"program_id": None}, synchronize_session=False
    )
    print(f"Nullified {updated} gallery program references")

    reactions = db.query(ProgramReaction).delete()
    print(f"Deleted {reactions} program reactions")

    programs = db.query(Program).delete()
    print(f"Deleted {programs} programs")

    sessions = db.query(Session).delete()
    print(f"Deleted {sessions} sessions")

    db.commit()
    print("Done — session data cleared, gallery intact")
