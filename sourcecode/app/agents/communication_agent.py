"""Communication agent and tool wrapper."""
from __future__ import annotations

import json
import re
import traceback

from app.agents.client import get_responses_client
from app.agents.customer_db_tool import customer_db_tool
from app.agents.sql_communication_tool import sql_communication_tool
from app.domain.schemas import AgentCommunicationResponse, CommunicationAgentRequest


_client = get_responses_client()

ascommunication_agent = _client.as_agent(
    name="communication_agent",
    instructions=(
        "ROLE: Communication Agent\n\n"

        "You generate customer-friendly updates and answers using job card data.\n"
        "You are NOT a router or estimator.\n\n"

        "========================\n"
        "INPUT STRUCTURE\n"
        "========================\n"
        "The input will be a JSON serialization of the CommunicationAgentRequest Pydantic model.\n"
        "It includes action, customer_id, job_card_id, vehicle_id, question, and tool_result.\n\n"

        "You MUST always read customer_id, job_card_id, vehicle_id, question, and tool_result from the input JSON.\n\n"

        "========================\n"
        "RESPONSE RULES\n"
        "========================\n"
        "- NEVER call tools. Tools are executed upstream and their output is provided in tool_result.\n"
        "- Use ONLY tool_result to answer the question.\n"
        "- If tool_result includes an 'answer' field, use it directly.\n"
        "- Prefix $ for all amounts and costs in the response.\n"
        "- Keep tone professional and concise.\n\n"

        "========================\n"
        "OUTPUT FORMAT\n"
        "========================\n"
        "Return ONLY raw JSON for the AgentCommunicationResponse Pydantic model.\n"
        "The JSON MUST include: agent, response, tone.\n"
    ),
)


async def _collect_json(agent, user_input: str) -> str:
    full = ""
    async for event in agent.run(user_input, stream=True, options={"response_format": AgentCommunicationResponse}):
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
    try:
        tool_result = None
        try:
            payload = json.loads(user_input)
        except json.JSONDecodeError:
            payload = None

        if isinstance(payload, dict):
            request = CommunicationAgentRequest.model_validate(payload)
            action = request.action
            customer_id = request.customer_id
            job_card_id = request.job_card_id
            vehicle_id = request.vehicle_id
            question = request.question

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
                    return model.model_dump_json(by_alias=True)
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
                    return model.model_dump_json(by_alias=True)
                tool_result = await sql_communication_tool(
                    customer_id=customer_id,
                    job_card_id=job_card_id,
                )

            request = CommunicationAgentRequest(
                action=action,
                customer_id=customer_id,
                job_card_id=job_card_id,
                vehicle_id=vehicle_id,
                question=question,
                tool_result=json.loads(tool_result),
            )
            user_input = request.model_dump_json(exclude_none=True)
        else:
            model = AgentCommunicationResponse(
                agent="communication_agent",
                message="Invalid request payload. Expected JSON input.",
                tone="professional",
            )
            return model.model_dump_json(by_alias=True)

        raw = await _collect_json(communication_agent, user_input)
        print("DEBUG RAW RESPONSE:", raw)
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {"response": raw}

        if isinstance(parsed, dict):
            if "response" not in parsed and "message" in parsed:
                parsed["response"] = parsed["message"]
            parsed.setdefault("agent", "communication_agent")
            parsed.setdefault("tone", "professional")
        else:
            parsed = {
                "agent": "communication_agent",
                "tone": "professional",
                "response": str(parsed),
            }

        model = AgentCommunicationResponse.model_validate(parsed)
        model.message = _prefix_dollar_amounts(model.message)
        return model.model_dump_json(by_alias=True)
    except Exception as exc:
        error_msg = f"communication_tool failed: {str(exc)}\n{traceback.format_exc()}"
        print("ERROR:", error_msg)
        model = AgentCommunicationResponse(
            agent="communication_agent",
            message="communication_tool function failed to process the request.",
            tone="professional",
        )
        return model.model_dump_json(by_alias=True)
