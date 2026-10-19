from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.system.controller import (
    PrivacyShield,
    PowerController,
    PerformanceOptimizer,
    NetworkController,
    SystemAssistant
)

router = APIRouter(prefix="/system", tags=["System Management & Privacy"])

class ShutdownRequest(BaseModel):
    minutes: int = Field(default=5, ge=1, le=1440, description="Shutdown delay in minutes")
    reason: Optional[str] = "Scheduled by ORBIT AI"

class SystemPromptRequest(BaseModel):
    prompt: str = Field(..., description="Natural language prompt for laptop control")

@router.get("/status")
def get_system_status():
    """
    Returns live laptop CPU, memory, power plan, battery, and top consumer processes.
    """
    return {
        "success": True,
        "data": PerformanceOptimizer.get_metrics()
    }

@router.post("/power/shutdown")
def schedule_shutdown(req: ShutdownRequest):
    """
    Schedules laptop shutdown with safety timer.
    """
    res = PowerController.schedule_shutdown(minutes=req.minutes, reason=req.reason)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", "Failed to schedule shutdown"))
    return res

@router.post("/power/cancel")
def cancel_shutdown():
    """
    Aborts any pending scheduled shutdown.
    """
    res = PowerController.cancel_shutdown()
    return res

@router.post("/power/restart")
def restart_laptop(minutes: int = 1):
    """
    Schedules restart.
    """
    return PowerController.restart(minutes=minutes)

@router.post("/power/lock")
def lock_laptop():
    """
    Locks the laptop workstation screen.
    """
    return PowerController.lock_workstation()

@router.post("/optimize/performance")
def optimize_performance():
    """
    Shifts background loads and trims unneeded memory working sets.
    """
    return PerformanceOptimizer.shift_and_optimize()

@router.post("/optimize/network")
def optimize_network():
    """
    Flushes DNS cache, measures network latency, and diagnoses connection speed.
    """
    return NetworkController.optimize_network()

@router.post("/prompt")
def handle_system_prompt(req: SystemPromptRequest):
    """
    Processes natural language commands for laptop control with strict Privacy Shield validation.
    """
    return SystemAssistant.handle_request(req.prompt)
