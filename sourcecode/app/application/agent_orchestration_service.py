"""Application service for multi-agent orchestration."""
from __future__ import annotations

from app.agents.master_agent import run_master_agent
from app.domain.schemas import MasterAgentRequest, MasterAgentResponse


def _build_intake_prompt(payload: MasterAgentRequest) -> str:
    if payload.user_input:
        return payload.user_input

    missing = [
        name
        for name, value in (
            ("vehicle_id", payload.vehicle_id),
            ("customer_complaint", payload.customer_complaint),
            ("obd_report_text", payload.obd_report_text),
        )
        if not value
    ]
    if missing:
        missing_list = ", ".join(missing)
        raise ValueError(f"Missing required fields: {missing_list}")

    return (
        f"Vehicle ID: {payload.vehicle_id}. "
        f"Complaint: {payload.customer_complaint}. "
        f"OBD report: {payload.obd_report_text}. "
        "Please generate job card."
    )


async def execute_master_agent(payload: MasterAgentRequest) -> MasterAgentResponse:
    user_input = _build_intake_prompt(payload)
    data = await run_master_agent(user_input)
    return data
