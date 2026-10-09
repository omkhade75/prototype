from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.models.factory import get_provider

router = APIRouter()

class TaskRequest(BaseModel):
    task_type: str  # summarize, extract, transform
    input_text: str
    parameters: Optional[Dict[str, Any]] = None
    provider: Optional[str] = None

@router.post("/execute")
async def execute_ai_task(req: TaskRequest):
    """
    Executes a bounded AI task for workflow nodes (summarize, extract, transform).
    """
    try:
        provider = get_provider(req.provider)
        res = await provider.execute_task(
            task_type=req.task_type,
            input_text=req.input_text,
            parameters=req.parameters
        )
        return {
            "success": True,
            **res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task execution failed: {str(e)}")
