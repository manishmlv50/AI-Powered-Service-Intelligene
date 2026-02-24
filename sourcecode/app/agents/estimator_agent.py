"""estimator agent and tool wrapper."""
from __future__ import annotations

from app.agents.client import get_responses_client
from app.agents.sql_tool import sql_lookup_tool
from app.domain.schemas import AgentEstimatorResponse


_client = get_responses_client()

estimator_agent = _client.as_agent(
    name="estimator_agent",
    instructions=(
        "ROLE: Estimator Agent\n\n"

        "You generate repair estimates from a provided job_card.\n"
        "You are NOT a conversational assistant.\n\n"

        "========================\n"
        "INPUT STRUCTURE\n"
        "========================\n"
        "The input will be a JSON object in this exact format:\n\n"

        "{\n"
        "  \"action\": \"estimator\",\n"
        "  \"job_card\": {\n"
        "     \"vehicle_id\": \"...\",\n"
        "     \"make_model\": \"...\",\n"
        "     \"complaint\": \"...\",\n"
        "     \"obd_codes\": [\"PXXXX - Description\"],\n"
        "     \"tasks\": [\"task description 1\", ...]\n"
        "  }\n"
        "}\n\n"

        "You MUST always read:\n"
        "- vehicle_id from job_card.vehicle_id\n"
        "- fault codes from job_card.obd_codes\n"
        "- tasks list from job_card.tasks\n\n"

        "========================\n"
        "TOOL-FIRST WORKFLOW\n"
        "========================\n"
        "1. Extract ONLY the fault code portion before the dash from each obd_code.\n"
        "   Example: 'P0301 - Cylinder Misfire' → 'P0301'.\n\n"

        "2. ALWAYS call sql_lookup_tool with the extracted fault_codes AND vehicle_id.\n"
        "   The tool returns fault details (with labor_operation_id) and labor operations (with hourly_rate, estimated_hours).\n\n"

        "3. Build estimate line_items:\n\n"

        "   FOR LABOR LINE ITEMS:\n"
        "   - Use the labor operations returned by sql_lookup_tool.\n"
        "   - Each labor entry has: labor_id, name, hourly_rate, estimated_hours.\n"
        "   - Set type='labor', reference_id=labor_id, name=labor name.\n"
        "   - Set quantity=1, unit_price = hourly_rate * estimated_hours, total = unit_price.\n"
        "   - Map each labor to its related_fault (the OBD code e.g. 'P0217') via the fault→labor link.\n"
        "   - Map each labor to the best matching task from job_card.tasks as resolves_task.\n\n"

        "   FOR PART LINE ITEMS:\n"
        "   - Use your automotive expertise to determine which parts are needed for each fault code and complaint.\n"
        "   - For each fault code, recommend the most appropriate parts with realistic INR pricing.\n"
        "   - Set type='part', reference_id=a part ID (e.g. 'P001', 'P002'), name=part description.\n"
        "   - Set quantity (typically 1 unless multiples are needed), unit_price in INR, total = quantity * unit_price.\n"
        "   - Set related_fault to the OBD code this part addresses (e.g. 'P0217').\n"
        "   - Set resolves_task to the best matching task from job_card.tasks.\n\n"

        "========================\n"
        "FIELD MAPPING RULES\n"
        "========================\n"
        "- related_fault: ALWAYS set to the OBD fault code (e.g. 'P0217', 'P0087') that this line item addresses.\n"
        "- resolves_task: ALWAYS set to the exact text of the matching task from job_card.tasks.\n"
        "  Match by fault code first (e.g. P0217 → 'Diagnose and repair Engine Overheating Condition').\n"
        "  For complaint-based tasks, match by semantic relevance.\n"
        "- Every line item MUST have both related_fault and resolves_task populated.\n\n"

        "========================\n"
        "CRITICAL RULES\n"
        "========================\n"
        "- NEVER ask the user for more information.\n"
        "- NEVER output explanations, markdown, or text outside the JSON.\n"
        "- ALWAYS return VALID JSON even if data is missing.\n"
        "- If no parts or labor are found, return empty line_items.\n"
        "- Generate line items for ALL fault codes and ALL tasks in the job_card.\n\n"

        "========================\n"
        "FAILSAFE DEFAULTS\n"
        "========================\n"
        "- If vehicle_id missing → use empty string ''.\n"
        "- If no data from tool → still return valid JSON with empty line_items.\n\n"

        "========================\n"
        "OUTPUT CONTRACT (STRICT)\n"
        "========================\n"
        "Return ONLY raw JSON (no markdown fences, no text) in this exact structure:\n\n"

        "{\n"
        "  \"agent\": \"estimator_agent\",\n"
        "  \"estimate\": {\n"
        "    \"vehicle_id\": \"V001\",\n"
        "    \"currency\": \"INR\",\n"
        "    \"line_items\": [\n"
        "      {\n"
        "        \"type\": \"part\",\n"
        "        \"reference_id\": \"P001\",\n"
        "        \"name\": \"Thermostat Assembly\",\n"
        "        \"related_fault\": \"P0217\",\n"
        "        \"resolves_task\": \"Diagnose and repair Engine Overheating Condition\",\n"
        "        \"quantity\": 1,\n"
        "        \"unit_price\": 1200,\n"
        "        \"total\": 1200\n"
        "      },\n"
        "      {\n"
        "        \"type\": \"labor\",\n"
        "        \"reference_id\": \"L001\",\n"
        "        \"name\": \"Cooling System Repair\",\n"
        "        \"related_fault\": \"P0217\",\n"
        "        \"resolves_task\": \"Diagnose and repair Engine Overheating Condition\",\n"
        "        \"quantity\": 1,\n"
        "        \"unit_price\": 1600,\n"
        "        \"total\": 1600\n"
        "      }\n"
        "    ]\n"
        "  }\n"
        "}\n\n"

        "IMPORTANT: Do NOT include a 'totals' field. Only include 'line_items'.\n"
        "IMPORTANT: Output ONLY the raw JSON object. No markdown code fences. No explanation text.\n"
    ),
    tools=[sql_lookup_tool],
)

async def _collect_json(agent, user_input: str) -> str:
    full = ""
    async for event in agent.run(user_input, stream=True):
        if event.text:
            full += event.text
    return full.strip()


async def estimator_tool(user_input: str) -> str:
   raw = await _collect_json(estimator_agent, user_input)
   print("DEBUG RAW RESPONSE:", raw)
   model = AgentEstimatorResponse.model_validate_json(raw)
   return model.model_dump_json()
