"""Providers endpoint — exposes available LLM providers and models to the frontend."""

from fastapi import APIRouter

from ..config import any_server_key_available
from ..services.providers.registry import PROVIDER_MODELS, PROVIDER_LABELS

router = APIRouter()


@router.get("/providers")
async def list_providers():
    return {
        "server_key_available": any_server_key_available(),
        "providers": [
            {
                "key": key,
                "label": PROVIDER_LABELS.get(key, key),
                "models": models,
            }
            for key, models in PROVIDER_MODELS.items()
        ],
    }
