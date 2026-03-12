import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import evolve, sessions, providers


def _cors_allow_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOW_ORIGINS")
    if raw:
        origins = [o.strip() for o in raw.split(",") if o.strip()]
        if origins:
            return origins

    # Local dev defaults. In production, set CORS_ALLOW_ORIGINS explicitly.
    origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    vercel_url = os.getenv("VERCEL_URL")
    if vercel_url:
        origins.append(f"https://{vercel_url}")
    return origins


def create_app(api_prefix: str = "/api") -> FastAPI:
    app = FastAPI(title="Symbolic Breeder API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_allow_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    prefixes: list[str] = []
    for prefix in (api_prefix, "/api", ""):
        if prefix not in prefixes:
            prefixes.append(prefix)

    for prefix in prefixes:
        include_in_schema = prefix == api_prefix
        app.include_router(evolve.router, prefix=prefix, include_in_schema=include_in_schema)
        app.include_router(sessions.router, prefix=prefix, include_in_schema=include_in_schema)
        app.include_router(providers.router, prefix=prefix, include_in_schema=include_in_schema)

    async def health() -> dict[str, str]:
        return {"status": "ok"}

    schema_health_path = f"{api_prefix}/health" if api_prefix else "/health"
    for path in ["/health", "/api/health"]:
        if path in {f"{p}/health" if p else "/health" for p in prefixes}:
            app.add_api_route(
                path,
                health,
                methods=["GET"],
                include_in_schema=(path == schema_health_path),
            )

    return app


app = create_app()
