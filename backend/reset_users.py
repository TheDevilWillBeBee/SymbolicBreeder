"""Delete all registered users while keeping schema and non-user content intact.

Because several tables reference users, this script clears user-dependent rows/links
before deleting users:
- Deletes program reactions (they require user_id)
- Resets shared_programs.like_count to 0 so counts match removed reactions
- Nullifies nullable user foreign keys on sessions/programs/shared_programs

Usage:
    cd backend
    # Ensure DATABASE_URL_UNPOOLED or DATABASE_URL is set
    python reset_users.py
"""

import os

os.environ["DATABASE_URL"] = os.environ.get("DATABASE_URL_UNPOOLED", os.environ.get("DATABASE_URL", ""))

from app.database import SessionLocal
from app.models.db import Program, ProgramReaction, Session, SharedProgram, User

with SessionLocal() as db:
    reactions = db.query(ProgramReaction).delete()
    print(f"Deleted {reactions} program reactions")

    like_counts_reset = db.query(SharedProgram).filter(SharedProgram.like_count != 0).update(
        {"like_count": 0}, synchronize_session=False
    )
    print(f"Reset like_count on {like_counts_reset} shared programs")

    session_owners = db.query(Session).filter(Session.owner_user_id.isnot(None)).update(
        {"owner_user_id": None}, synchronize_session=False
    )
    print(f"Nullified owner_user_id on {session_owners} sessions")

    program_creators = db.query(Program).filter(Program.creator_user_id.isnot(None)).update(
        {"creator_user_id": None}, synchronize_session=False
    )
    print(f"Nullified creator_user_id on {program_creators} programs")

    shared_sharers = db.query(SharedProgram).filter(SharedProgram.sharer_user_id.isnot(None)).update(
        {"sharer_user_id": None}, synchronize_session=False
    )
    print(f"Nullified sharer_user_id on {shared_sharers} shared programs")

    users = db.query(User).delete()
    print(f"Deleted {users} users")

    db.commit()
    print("Done - all registered users deleted, schema/content tables preserved")
