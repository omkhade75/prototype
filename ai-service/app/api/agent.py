from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.agents.executor import AgentExecutor
from app.tools.registry import tool_registry

router = APIRouter()

class AgentRunRequest(BaseModel):
    message: str
    chunks: Optional[List[Dict[str, Any]]] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    max_steps: Optional[int] = 5

@router.get("/tools")
async def get_available_tools():
    """
    Returns definitions and parameter schemas of all permitted agent tools.
    """
    return {
        "success": True,
        "tools": tool_registry.get_tool_definitions()
    }

@router.post("/run")
async def run_agent(req: AgentRunRequest):
    """
    Executes a bounded agent run, returning step-by-step reasoning, tool calls,
    durations, and final response.
    """
    try:
        executor = AgentExecutor(provider_name=req.provider, model=req.model)
        result = await executor.run(
            user_message=req.message,
            context_chunks=req.chunks,
            max_steps=req.max_steps
        )
        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent run failed: {str(e)}")
