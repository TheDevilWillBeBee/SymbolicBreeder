"""Reset gallery data (shared_programs) and dependent reactions.

Program reactions reference shared gallery items via program_reactions.shared_program_id,
so reactions must be deleted before shared_programs to satisfy FK constraints.

Usage:
    cd backend
    # Ensure DATABASE_URL_UNPOOLED or DATABASE_URL is set
    python reset_gallery.py
"""

import os

os.environ["DATABASE_URL"] = os.environ.get("DATABASE_URL_UNPOOLED", os.environ.get("DATABASE_URL", ""))

from app.database import SessionLocal
from app.models.db import ProgramReaction, SharedProgram

with SessionLocal() as db:
    reactions = db.query(ProgramReaction).delete()
    print(f"Deleted {reactions} program reactions")

    shared_programs = db.query(SharedProgram).delete()
    print(f"Deleted {shared_programs} shared programs")

    db.commit()
    print("Done - gallery and dependent reactions cleared")