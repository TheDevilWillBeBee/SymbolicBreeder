"""Delete the most recently added shared program and its dependent reactions.

Program reactions reference shared gallery items via program_reactions.shared_program_id,
so reactions for the selected item must be deleted before deleting shared_programs
to satisfy FK constraints.

Usage:
    cd backend
    # Ensure DATABASE_URL_UNPOOLED or DATABASE_URL is set
    python delete_last_shared_program.py
"""

import os

os.environ["DATABASE_URL"] = os.environ.get("DATABASE_URL_UNPOOLED", os.environ.get("DATABASE_URL", ""))

from app.database import SessionLocal
from app.models.db import ProgramReaction, SharedProgram

with SessionLocal() as db:
    last_shared_program = (
        db.query(SharedProgram)
        .order_by(SharedProgram.created_at.desc(), SharedProgram.id.desc())
        .first()
    )

    if last_shared_program is None:
        print("No shared programs found - nothing to delete")
    else:
        reactions = (
            db.query(ProgramReaction)
            .filter(ProgramReaction.shared_program_id == last_shared_program.id)
            .delete()
        )
        print(
            f"Deleted {reactions} program reactions for shared_program_id={last_shared_program.id}"
        )

        deleted = db.query(SharedProgram).filter(SharedProgram.id == last_shared_program.id).delete()
        print(f"Deleted {deleted} shared program (id={last_shared_program.id})")

        db.commit()
        print("Done - latest shared program and dependent reactions cleared")