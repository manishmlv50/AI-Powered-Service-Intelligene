"""API routes for agent orchestration."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.application.agent_orchestration_service import execute_master_agent
from app.domain.schemas import MasterAgentRequest, MasterAgentResponse

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.post("/master", response_model=dict)
async def run_master_agent(payload: MasterAgentRequest) -> dict:
    try:
        return await execute_master_agent(payload)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
