"""Communication agent and tool wrapper."""
from __future__ import annotations

import json
import re

from app.agents.client import get_responses_client
from app.agents.customer_db_tool import customer_db_tool
from app.agents.sql_communication_tool import sql_communication_tool
from app.domain.schemas import AgentCommunicationResponse


_client = get_responses_client()

communication_agent = _client.as_agent(
    name="communication_agent",
    instructions=(
        "ROLE: Communication Agent\n\n"

        "You generate customer-friendly updates and answers using job card data.\n"
        "You are NOT a router or estimator.\n\n"

        "========================\n"
        "INPUT STRUCTURE\n"
        "========================\n"
        "The input will be a JSON object in this exact format:\n\n"

        "{\n"
        "  \"action\": \"communication | chat\",\n"
        "  \"customer_id\": \"C001\",\n"
        "  \"job_card_id\": \"J001\",\n"
        "  \"vehicle_id\": \"V001\",\n"
        "  \"question\": \"what is the job_status?\"\n"
        "}\n\n"

        "You MUST always read customer_id, job_card_id, vehicle_id, and question from the input JSON.\n\n"

        "========================\n"
        "TOOL SELECTION WORKFLOW\n"
        "========================\n"
        "STEP 1 — INPUT ANALYSIS\n"
        "- Extract action, customer_id, job_card_id, vehicle_id, question.\n\n"

        "STEP 2 — TOOL USAGE BASED ON ACTION\n"
        "- If action is 'communication': Call sql_communication_tool with customer_id and job_card_id.\n"
        "- If action is 'chat': Call customer_db_tool with customer_id, job_card_id, vehicle_id, and question.\n"
        "- You MUST call the appropriate tool BEFORE generating output when required fields are provided.\n\n"

        "STEP 3 — BUILD RESPONSE USING TOOL DATA ONLY\n"
        "- Use ONLY the data returned from the called tool to answer the question.\n"
        "- If tool_result includes an 'answer' field, use it directly.\n"
        "- Prefix $ for all amounts and costs in the response.\n"
        "- Keep tone professional and concise.\n\n"

        "========================\n"
        "OUTPUT FORMAT\n"
        "========================\n"
        "Return ONLY JSON:\n\n"

        "{\n"
        "  \"agent\": \"communication_agent\",\n"
        "  \"message\": \"...\",\n"
        "  \"tone\": \"professional\"\n"
        "}\n"
    ),
    tools=[sql_communication_tool, customer_db_tool],
)


async def _collect_json(agent, user_input: str) -> str:
    full = ""
    async for event in agent.run(user_input, stream=True):
        if event.text:
            full += event.text
    return full.strip()


_AMOUNT_KEYWORDS = (
    "total",
    "amount",
    "cost",
    "price",
    "labor",
    "labour",
    "parts",
    "tax",
    "payable",
    "subtotal",
    "grand total",
)


def _prefix_dollar_amounts(text: str) -> str:
    if not text:
        return text
    keyword_pattern = "|".join(re.escape(word) for word in _AMOUNT_KEYWORDS)
    pattern = re.compile(
        rf"(?P<lead>\b(?:{keyword_pattern})\b[^\d\$]*)(?P<amount>(?:\d{{1,3}}(?:,\d{{3}})*|\d+)(?:\.\d{{1,2}})?)",
        flags=re.IGNORECASE,
    )

    def _repl(match: re.Match) -> str:
        lead = match.group("lead")
        amount = match.group("amount")
        if amount.startswith("$"):
            return f"{lead}{amount}"
        return f"{lead}${amount}"

    return pattern.sub(_repl, text)


async def communication_tool(user_input: str) -> str:
    tool_result = None
    try:
        payload = json.loads(user_input)
    except json.JSONDecodeError:
        payload = None

    if isinstance(payload, dict):
        action = payload.get("action")
        customer_id = payload.get("customer_id")
        job_card_id = payload.get("job_card_id")
        vehicle_id = payload.get("vehicle_id")
        question = payload.get("question")

        if action == "chat":
            missing = [
                key
                for key, value in {
                    "customer_id": customer_id,
                    "job_card_id": job_card_id,
                    "vehicle_id": vehicle_id,
                    "question": question,
                }.items()
                if not value
            ]
            if missing:
                model = AgentCommunicationResponse(
                    agent="communication_agent",
                    message=(
                        "Missing required fields: "
                        + ", ".join(missing)
                        + "."
                    ),
                    tone="professional",
                )
                return model.model_dump_json()
            tool_result = await customer_db_tool(
                customer_id=customer_id,
                job_card_id=job_card_id,
                vehicle_id=vehicle_id,
                question=question,
            )
        else:
            missing = [
                key
                for key, value in {
                    "customer_id": customer_id,
                    "job_card_id": job_card_id,
                    "question": question,
                }.items()
                if not value
            ]
            if missing:
                model = AgentCommunicationResponse(
                    agent="communication_agent",
                    message=(
                        "Missing required fields: "
                        + ", ".join(missing)
                        + "."
                    ),
                    tone="professional",
                )
                return model.model_dump_json()
            tool_result = await sql_communication_tool(
                customer_id=customer_id,
                job_card_id=job_card_id,
            )

        payload = {
            **payload,
            "tool_result": json.loads(tool_result),
        }
        user_input = json.dumps(payload)

    raw = await _collect_json(communication_agent, user_input)
    print("DEBUG RAW RESPONSE:", raw)
    model = AgentCommunicationResponse.model_validate_json(raw)
    model.message = _prefix_dollar_amounts(model.message)
    return model.model_dump_json()
