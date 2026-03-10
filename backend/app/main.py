from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import evolve, sessions

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Symbolic Breeder API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evolve.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
