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
         "You are a master orchestration agent.\n\n"
        "Analyze the user input and decide which ONE specialist tool to call.\n\n"
        "TOOLS:\n"
        "- intake_tool\n"
        "- estimator_tool\n"
        "- communication_tool\n"
        "- eta_tool\n\n"
        "RULES:\n"
        "- Call ONLY ONE tool.\n"
        "- Return ONLY that tool's JSON response.\n"
        "- DO NOT wrap or merge responses.\n"
        "- DO NOT add workflow or result fields.\n"
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
