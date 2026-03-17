import os

os.environ['DATABASE_URL'] = os.environ.get("POSTGRES_URL_NON_POOLING")

from app.database import SessionLocal
from app.models.db import SharedProgram
with SessionLocal() as db:
    db.query(SharedProgram).delete()
    db.commit()
    print('Cleared shared_programs table')