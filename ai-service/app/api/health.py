from fastapi import APIRouter
from app.models.factory import get_system_ai_status

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Returns AI service health and active model provider status.
    """
    status = await get_system_ai_status()
    return {
        "status": "healthy",
        "service": "orbit-ai-python-service",
        **status
    }
