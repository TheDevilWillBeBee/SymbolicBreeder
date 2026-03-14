"""Providers endpoint — exposes available LLM providers and models to the frontend."""

import os

from fastapi import APIRouter

from ..services.providers.registry import PROVIDER_MODELS, PROVIDER_LABELS

router = APIRouter()


@router.get("/providers")
async def list_providers():
    server_key_available = bool(
        os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    )
    return {
        "server_key_available": server_key_available,
        "providers": [
            {
                "key": key,
                "label": PROVIDER_LABELS.get(key, key),
                "models": models,
            }
            for key, models in PROVIDER_MODELS.items()
        ],
    }
