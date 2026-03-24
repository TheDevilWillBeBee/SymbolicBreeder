from fastapi import APIRouter

from ..services.context import list_context_versions, list_modalities

router = APIRouter()


@router.get("/context/catalog")
async def context_catalog():
    modalities = list_modalities()
    return {
        "modalities": [
            {
                "key": modality,
                "versions": list_context_versions(modality),
            }
            for modality in modalities
        ]
    }
