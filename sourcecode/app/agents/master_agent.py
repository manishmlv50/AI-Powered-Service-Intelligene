"""Master agent and specialist tools for orchestration."""
from __future__ import annotations

import json
from typing import Optional
from pydantic import BaseModel

from app.agents.client import get_responses_client
from app.agents.intake_agent import intake_tool


class EstimateResponse(BaseModel):
    agent: str
    estimated_cost: str
    currency: str
    notes: Optional[str] = None


class CommunicationResponse(BaseModel):
    agent: str
    message: str
    tone: str


class ETAResponse(BaseModel):
    agent: str
    eta: str
    schedule_notes: Optional[str] = None


_client = get_responses_client()

estimator_agent = _client.as_agent(
    name="estimator_agent",
    instructions=(
        "Provide cost estimation.\n\n"
        "Return ONLY JSON:\n\n"
        "{\n"
        "  \"agent\":\"estimator_agent\",\n"
        "  \"estimated_cost\":\"...\",\n"
        "  \"currency\":\"INR\",\n"
        "  \"notes\":\"...\"\n"
        "}"
    ),
)

communication_agent = _client.as_agent(
    name="communication_agent",
    instructions=(
        "Generate customer-friendly communication.\n\n"
        "Return ONLY JSON:\n\n"
        "{\n"
        "  \"agent\":\"communication_agent\",\n"
        "  \"message\":\"...\",\n"
        "  \"tone\":\"professional\"\n"
        "}"
    ),
)

eta_agent = _client.as_agent(
    name="eta_agent",
    instructions=(
        "Calculate ETA.\n\n"
        "Return ONLY JSON:\n\n"
        "{\n"
        "  \"agent\":\"eta_agent\",\n"
        "  \"eta\":\"...\",\n"
        "  \"schedule_notes\":\"...\"\n"
        "}"
    ),
)


async def _collect_json(agent, user_input: str) -> str:
    full = ""
    async for event in agent.run(user_input, stream=True):
        if event.text:
            full += event.text
    return full.strip()


async def estimator_tool(user_input: str) -> str:
    raw = await _collect_json(estimator_agent, user_input)
    model = EstimateResponse.model_validate_json(raw)
    return model.model_dump_json()


async def communication_tool(user_input: str) -> str:
    raw = await _collect_json(communication_agent, user_input)
    model = CommunicationResponse.model_validate_json(raw)
    return model.model_dump_json()


async def eta_tool(user_input: str) -> str:
    raw = await _collect_json(eta_agent, user_input)
    model = ETAResponse.model_validate_json(raw)
    return model.model_dump_json()


master_agent = _client.as_agent(
    name="master_agent",
        instructions=(
        "ROLE: Master Orchestration Agent\n\n"

        "You are NOT a conversational assistant. "
        "Your job is ONLY to route the request to exactly ONE tool.\n\n"

        "AVAILABLE TOOLS:\n"
        "- intake_tool → For NEW vehicle intake requests.\n"
        "- estimator_tool → For cost estimation questions.\n"
        "- communication_tool → For customer messaging.\n"
        "- eta_tool → For scheduling or ETA questions.\n\n"

        "ROUTING RULES (STRICT PRIORITY ORDER):\n"
        "1. If the user input contains vehicle_id OR vehicle number AND a complaint OR OBD report text → "
        "this is ALWAYS a NEW INTAKE. You MUST call intake_tool.\n"
        "2. Only call estimator_tool if the user explicitly asks about cost, price, or estimate.\n"
        "3. Only call eta_tool if the user asks about time, schedule, or completion ETA.\n"
        "4. Only call communication_tool if the user asks to generate a message for the customer.\n\n"

        "IMPORTANT:\n"
        "- Intake requests have HIGHEST priority.\n"
        "- If intake signals exist, DO NOT call any other tool.\n"
        "- NEVER respond with normal text.\n"
        "- ALWAYS call exactly ONE tool.\n\n"

        "OUTPUT CONTRACT:\n"
        "- Your final response MUST be ONLY the JSON returned by the selected tool.\n"
        "- Do NOT include explanations, markdown, or additional fields.\n"
    ),
    tools=[
        intake_tool,
        estimator_tool,
        communication_tool,
        eta_tool,
    ],
)


async def run_master_agent(user_input: str) -> dict:
    raw = await _collect_json(master_agent, user_input)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError("Master agent returned invalid JSON") from exc
