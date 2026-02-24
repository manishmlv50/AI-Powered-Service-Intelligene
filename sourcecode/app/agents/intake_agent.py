"""Intake agent and tool wrapper."""
from __future__ import annotations

from app.agents.client import get_responses_client
from app.agents.sql_tool import sql_lookup_tool
from app.domain.schemas import AgentIntakeResponse


_client = get_responses_client()

intake_agent = _client.as_agent(
    name="intake_agent",
    instructions=(
        "Handle customer intake using the provided vehicle id, complaint, "
        "and OBD report text. Use sql_lookup_tool to fetch vehicle, customer, "
        "or parts details when ids or part codes are available.\n\n"
        "Return ONLY JSON:\n\n"
        "{\n"
        "  \"agent\":\"intake_agent\",\n"
        "  \"vehicle_id\":\"...\",\n"
        "  \"customer_complaint\":\"...\",\n"
        "  \"obd_report_summary\":\"...\",\n"
        "  \"job_details\":\"...\"\n"
        "}"
    ),
    response_format=AgentIntakeResponse,
    tools=[sql_lookup_tool],
)

async def _collect_json(agent, user_input: str) -> str:
    full = ""
    async for event in agent.run(user_input, stream=True):
        if event.text:
            full += event.text
    return full.strip()


async def intake_tool(user_input: str) -> str:
    raw = await _collect_json(intake_agent, user_input)
    model = AgentIntakeResponse.model_validate_json(raw)
    return model.model_dump_json()
