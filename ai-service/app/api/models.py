"""
ORBIT AI — Phase 5: FastAPI Endpoints for AI Model Library & Learning Center.
Exposes catalogue discovery, hardware recommendations, local Ollama management,
model testing, and learning guides.
"""

from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json

from app.models.catalog_service import ModelCatalogService
from app.models.ollama_manager import OllamaManager
from app.models.catalog_data import HARDWARE_PRESETS

router = APIRouter(prefix="/models", tags=["AI Model Library"])


class RecommendRequest(BaseModel):
    task: Optional[str] = "coding"
    ram_gb: Optional[float] = 16.0
    vram_gb: Optional[float] = 6.0
    disk_free_gb: Optional[float] = 100.0
    speed_preference: Optional[str] = "balanced"
    license_constraint: Optional[str] = "any"


class InspectRequest(BaseModel):
    model_name: str


class PullRequest(BaseModel):
    model_name: str
    confirmed: bool = False


class TestModelRequest(BaseModel):
    model_name: str
    prompt: str
    system_prompt: Optional[str] = None
    category: Optional[str] = "general"


@router.get("/catalog")
def get_catalog(
    query: Optional[str] = None,
    task: Optional[str] = "all",
    modality: Optional[str] = "all",
    publisher: Optional[str] = "all",
    max_size_gb: Optional[float] = None,
    fits_vram_gb: Optional[float] = None,
    page: int = 1,
    page_size: int = 12
):
    """
    Returns filtered, paginated models from verified catalog.
    """
    return ModelCatalogService.search_catalog(
        query=query,
        task=task,
        modality=modality,
        publisher=publisher,
        max_size_gb=max_size_gb,
        fits_vram_gb=fits_vram_gb,
        page=page,
        page_size=page_size
    )


@router.get("/catalog/{model_id:path}")
def get_model_card(model_id: str):
    """
    Returns full metadata, learning guide, benchmarks, and workflow examples for a model.
    """
    card = ModelCatalogService.get_model_details(model_id)
    if not card:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found in catalog.")
    return card


@router.get("/presets")
def get_hardware_presets():
    """
    Returns hardware reference profiles, including HP Victus Laptop (RTX 3050 6GB).
    """
    storage = OllamaManager.get_disk_storage()
    return {
        "presets": HARDWARE_PRESETS,
        "current_drive_storage": storage
    }


@router.post("/recommend")
def recommend_models(req: RecommendRequest):
    """
    Evaluates hardware profile and returns a ranked shortlist with compromises and fit badges.
    """
    return ModelCatalogService.recommend_models(
        task=req.task or "coding",
        ram_gb=req.ram_gb or 16.0,
        vram_gb=req.vram_gb or 6.0,
        disk_free_gb=req.disk_free_gb or 100.0,
        speed_preference=req.speed_preference or "balanced",
        license_constraint=req.license_constraint or "any"
    )


@router.get("/huggingface")
async def search_huggingface(query: str = "coder", limit: int = 8):
    """
    Queries Hugging Face Hub metadata API for open-weights discovery.
    """
    models = await ModelCatalogService.query_huggingface_hub(query=query, limit=limit)
    return {"query": query, "models": models}


@router.get("/local")
async def get_local_models():
    """
    Queries real Ollama daemon for installed models, versions, and storage usage.
    """
    return await OllamaManager.list_local_models()


@router.post("/local/inspect")
async def inspect_local_model(req: InspectRequest):
    """
    Retrieves low-level Ollama parameter configuration and template for a local model.
    """
    if not OllamaManager.validate_model_name(req.model_name):
        raise HTTPException(status_code=400, detail=f"Invalid model name: '{req.model_name}'")
    return await OllamaManager.inspect_model(req.model_name)


@router.post("/local/pull")
async def pull_model(req: PullRequest):
    """
    Streams genuine download progress from Ollama.
    Requires explicit confirmation flag.
    """
    if not OllamaManager.validate_model_name(req.model_name):
        raise HTTPException(status_code=400, detail=f"Invalid model name: '{req.model_name}'")
    if not req.confirmed:
        return {
            "status": "confirmation_required",
            "message": f"Downloading '{req.model_name}' requires explicit student confirmation.",
            "model_name": req.model_name
        }

    async def event_generator():
        async for item in OllamaManager.pull_model_stream(req.model_name):
            yield f"data: {json.dumps(item)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.delete("/local/{model_name}")
async def delete_local_model(model_name: str, confirmed: bool = Query(False)):
    """
    Deletes a local model with safety confirmation gate.
    """
    if not OllamaManager.validate_model_name(model_name):
        raise HTTPException(status_code=400, detail=f"Invalid model name: '{model_name}'")
    if not confirmed:
        raise HTTPException(
            status_code=400,
            detail=f"Deleting local model '{model_name}' requires explicit confirmation (?confirmed=true)."
        )

    res = await OllamaManager.delete_model(model_name)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", "Delete failed"))
    return res


@router.post("/test")
async def test_model(req: TestModelRequest):
    """
    Executes an interactive test prompt on an installed model and returns latency metrics.
    """
    if not OllamaManager.validate_model_name(req.model_name):
        raise HTTPException(status_code=400, detail=f"Invalid model name: '{req.model_name}'")
    return await OllamaManager.test_model_prompt(
        model_name=req.model_name,
        prompt=req.prompt,
        system_prompt=req.system_prompt
    )
