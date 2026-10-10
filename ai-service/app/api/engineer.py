"""
ORBIT AI — Phase 4A: FastAPI Routes for Software Engineer Agent.
Exposes endpoints for project planning, full-stack generation, and automated repair.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.engineer.planner import ProjectPlanner
from app.engineer.agent import SoftwareEngineerAgent

router = APIRouter(prefix="/engineer", tags=["Software Engineer Agent"])


class PlanRequest(BaseModel):
    project_id: str
    prompt: str
    stack: Optional[str] = "react-express-sqlite"
    provider: Optional[str] = "demo"
    model: Optional[str] = None


class GenerateRequest(BaseModel):
    project_id: str
    workspace_root: str
    prompt: str
    stack: Optional[str] = "react-express-sqlite"
    provider: Optional[str] = "demo"
    model: Optional[str] = None
    allow_host_override: Optional[bool] = False


class RepairRequest(BaseModel):
    project_id: str
    workspace_root: str
    error_details: str
    provider: Optional[str] = "demo"
    model: Optional[str] = None


@router.post("/plan")
async def plan_project(req: PlanRequest):
    """
    Analyzes project specification and produces architecture + task decomposition.
    """
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Project specification prompt cannot be empty.")

    try:
        plan = await ProjectPlanner.analyze_specification(
            prompt=req.prompt,
            stack=req.stack or "react-express-sqlite",
            provider_name=req.provider or "demo",
            model=req.model
        )
        return {
            "success": True,
            "project_id": req.project_id,
            "provider": req.provider,
            "model": req.model,
            **plan
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
async def generate_project(req: GenerateRequest):
    """
    Executes the full software engineering development loop:
    Plan -> Scaffold -> Inspect -> Test -> Repair -> Summary.
    """
    if not req.workspace_root:
        raise HTTPException(status_code=400, detail="workspace_root is required.")

    agent = SoftwareEngineerAgent(provider_name=req.provider, model=req.model)
    try:
        result = await agent.execute_full_lifecycle(
            project_id=req.project_id,
            workspace_root=req.workspace_root,
            prompt=req.prompt,
            stack=req.stack or "react-express-sqlite",
            allow_host_override=bool(req.allow_host_override)
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/repair")
async def repair_project(req: RepairRequest):
    """
    Diagnoses error output and applies a targeted fix.
    """
    agent = SoftwareEngineerAgent(provider_name=req.provider, model=req.model)
    try:
        result = await agent.diagnose_and_repair(
            workspace_root=req.workspace_root,
            error_output=req.error_details
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

