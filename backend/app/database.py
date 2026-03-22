import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


def _resolve_database_url() -> str:
    # Vercel Postgres exposes one or more URL variables depending on setup.
    for key in (
        "DATABASE_URL",
        "POSTGRES_URL",
        "POSTGRES_PRISMA_URL",
        "POSTGRES_URL_NON_POOLING",
    ):
        value = os.getenv(key)
        if value:
            return value

    raise RuntimeError(
        "PostgreSQL connection URL is required. Set DATABASE_URL (or a Vercel "
        "POSTGRES_* URL). SQLite is not supported in this deployment mode."
    )


def _normalize_sqlalchemy_url(url: str) -> str:
    # SQLAlchemy 2+ requires the psycopg3 dialect prefix; Vercel and most
    # connection string generators still emit the older "postgres://" scheme.
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


DATABASE_URL = _normalize_sqlalchemy_url(_resolve_database_url())

if DATABASE_URL.startswith("sqlite"):
    raise RuntimeError("SQLite is not supported. Configure a PostgreSQL DATABASE_URL.")

engine = create_engine(
    DATABASE_URL,
    # pool_pre_ping sends a lightweight "SELECT 1" before handing out a
    # connection, which recycles stale connections after network interruptions
    # or database restarts (common in serverless/Vercel environments).
    pool_pre_ping=True,
    # pool_recycle forces connections to be replaced after 5 minutes to avoid
    # hitting PostgreSQL's idle connection timeout (default: 10 minutes on
    # most managed services). Keeps the pool healthy over long idle periods.
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
