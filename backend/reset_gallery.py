import os

os.environ["DATABASE_URL"] = os.environ.get("DATABASE_URL_UNPOOLED", os.environ.get("DATABASE_URL", ""))

from app.database import SessionLocal
from app.models.db import SharedProgram
with SessionLocal() as db:
    db.query(SharedProgram).delete()
    db.commit()
    print('Cleared shared_programs table')