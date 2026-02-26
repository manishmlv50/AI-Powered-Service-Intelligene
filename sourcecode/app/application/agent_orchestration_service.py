"""Application service for multi-agent orchestration."""
from __future__ import annotations

import json as _json

from app.agents.master_agent import run_master_agent
from app.domain.schemas import MasterAgentRequest, MasterAgentResponse


def _build_prompt(payload: MasterAgentRequest) -> str:
    """Build a structured prompt that always carries the action field."""
    if payload.action == "communication":
        if not payload.customer_id or not payload.job_card_id:
            raise ValueError("communication action requires customer_id and job_card_id.")
        prompt_obj: dict = {
            "action": payload.action,
            "customer_id": payload.customer_id,
            "job_card_id": payload.job_card_id,
        }
        if payload.question:
            prompt_obj["question"] = payload.question
        if payload.user_input:
            prompt_obj["user_input"] = payload.user_input
        if payload.context:
            prompt_obj["context"] = payload.context
        return _json.dumps(prompt_obj)
    # If job_card is provided, build the exact JSON structure the estimator expects.
    if payload.job_card:
        prompt_obj: dict = {}
        if payload.action:
            prompt_obj["action"] = payload.action
        prompt_obj["job_card"] = payload.job_card
        return _json.dumps(prompt_obj)

    # Free-form override: still prepend action so the router sees it.
    if payload.user_input:
        if payload.action:
            return f"action: {payload.action}\n{payload.user_input}"
        return payload.user_input

    parts: list[str] = []

    if payload.action:
        parts.append(f"action: {payload.action}")

    if payload.vehicle_id:
        parts.append(f"Vehicle ID: {payload.vehicle_id}")
    if payload.customer_id:
        parts.append(f"Customer ID: {payload.customer_id}")
    if payload.customer_complaint:
        parts.append(f"Complaint: {payload.customer_complaint}")
    if payload.obd_report_text:
        parts.append(f"OBD report: {payload.obd_report_text}")
    if payload.job_card_id:
        parts.append(f"Job Card ID: {payload.job_card_id}")
    if payload.question:
        parts.append(f"Question: {payload.question}")
    if payload.context:
        parts.append(f"Context: {_json.dumps(payload.context)}")

    if not parts:
        raise ValueError("Request must include at least an action or user_input.")

    return ". ".join(parts) + "."


async def execute_master_agent(payload: MasterAgentRequest) -> MasterAgentResponse:
    user_input = _build_prompt(payload)
    data = await run_master_agent(user_input)
    return data
