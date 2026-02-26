"""Master agent and specialist tools for orchestration."""
from __future__ import annotations

import json
from typing import Optional
from pydantic import BaseModel

from app.agents.client import get_responses_client
from app.agents.intake_agent import intake_tool
from app.agents.estimator_agent import estimator_tool


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
        "ROLE: Master Orchestration Agent — Single-Dispatch Router\n\n"

        "You are a deterministic router in a multi-agent system.\n"
        "Your ONLY job is to forward the ENTIRE user input to EXACTLY ONE tool "
        "and return its raw JSON output. You perform NO computation yourself.\n\n"

        "═══════════════════════════════════\n"
        "ROUTING TABLE  (evaluated top-to-bottom, first match wins)\n"
        "═══════════════════════════════════\n\n"

        "ACTION VALUE         → TOOL TO CALL\n"
        "─────────────────────────────────────\n"
        "intake               → intake_tool\n"
        "estimator | estimate → estimator_tool\n"
        "communication        → communication_tool\n"
        "eta                  → eta_tool\n\n"

        "FALLBACK (only when action is missing or empty):\n"
        "- Input contains vehicle_id AND (customer_complaint OR obd_report_text) → intake_tool\n"
        "- Input contains job_card or obd_codes with cost/parts context          → estimator_tool\n"
        "- Input asks about scheduling, timing, or delivery date                 → eta_tool\n"
        "- Input requests a message, notification, or approval text              → communication_tool\n"
        "- If STILL ambiguous                                                    → intake_tool  (safe default)\n\n"

        "═══════════════════════════════════\n"
        "STRICT RULES  (violations = system failure)\n"
        "═══════════════════════════════════\n\n"

        "1. Call EXACTLY ONE tool per request. Never two, never zero.\n"
        "2. When an action value is present, it is AUTHORITATIVE — do NOT override it.\n"
        "3. Pass the FULL user input text to the chosen tool unchanged.\n"
        "4. Return ONLY the raw JSON produced by the tool — no wrapper, no commentary.\n"
        "5. NEVER generate your own answer, ask follow-up questions, or add explanations.\n"
        "6. NEVER chain tools — one request = one tool call = one response.\n"
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
