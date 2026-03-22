import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import gallery, evolve, sessions, providers


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

    # Dual-prefix registration: the same routers are mounted at both the
    # configured api_prefix (e.g. "/api" locally) and at "/" (used by Vercel
    # serverless functions, which strip the "/api" prefix before forwarding).
    # Only the api_prefix routes are included in the OpenAPI schema to avoid
    # duplicate entries in /docs.
    _routers = [evolve.router, sessions.router, providers.router, gallery.router]
    prefixes: list[str] = list(dict.fromkeys([api_prefix, "/api", ""]))

    for prefix in prefixes:
        for router in _routers:
            app.include_router(
                router,
                prefix=prefix,
                include_in_schema=(prefix == api_prefix),
            )

    # Health check registered at all active prefixes
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    for prefix in prefixes:
        path = f"{prefix}/health" if prefix else "/health"
        app.add_api_route(
            path,
            health,
            methods=["GET"],
            include_in_schema=(prefix == api_prefix),
        )

    return app


app = create_app()
