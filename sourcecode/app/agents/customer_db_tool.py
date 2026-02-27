"""Customer database tool for communication agent."""
from __future__ import annotations

import asyncio
import json

from app.agents.client import get_responses_client
from app.domain.schemas import (
    CustomerDbAnswer,
    CustomerDbToolResult,
    SqlEstimateDetails,
    SqlEstimateLineItemDetails,
    SqlJobCardDetails,
    SqlLaborDetails,
    SqlFaultDetails,
    SqlPartDetails,
    SqlQuestionAnswerContext,
    SqlUserDetails,
    SqlVehicleDetails,
)
from app.infrastructure.sql_repository import SqlRepository

_repo: SqlRepository | None = None
_client = get_responses_client()


customer_db_reasoner = _client.as_agent(
    name="customer_db_reasoner",
    instructions=(
        "ROLE: Customer DB Reasoning Tool\n\n"
        "You answer a customer question using ONLY the provided database context.\n"
        "You are NOT a general assistant.\n\n"

        "========================\n"
        "INPUT STRUCTURE\n"
        "========================\n"
        "The input will be a JSON object in this exact format:\n\n"

        "{\n"
        "  \"question\": \"...\",\n"
        "  \"context\": { ... }\n"
        "}\n\n"

        "========================\n"
        "STRICT INSTRUCTIONS\n"
        "========================\n"
        "- Use ONLY the fields inside context to answer.\n"
        "- If the answer is not present in context, say: \"I don't have that information in the provided records.\"\n"
        "- Do NOT guess, infer, or add external knowledge.\n"
        "- Keep the response short, professional, and customer-friendly.\n"
        "- Do NOT include markdown or extra commentary.\n\n"

        "========================\n"
        "OUTPUT FORMAT (STRICT)\n"
        "========================\n"
        "Return ONLY raw JSON in this exact format:\n\n"

        "{\n"
        "  \"answer\": \"...\"\n"
        "}\n"
    ),
)


def _get_repo() -> SqlRepository:
    global _repo
    if _repo is None:
        _repo = SqlRepository.from_env()
    return _repo


def _normalize_job_card(job_card: dict | None) -> dict | None:
    if not job_card:
        return None
    normalized = dict(job_card)
    created_at = normalized.get("created_at")
    if hasattr(created_at, "isoformat"):
        normalized["created_at"] = created_at.isoformat()
    risk_indicators = normalized.get("risk_indicators")
    if isinstance(risk_indicators, str):
        if not risk_indicators.strip():
            normalized["risk_indicators"] = []
        else:
            normalized["risk_indicators"] = [risk_indicators]
    return normalized


def _normalize_estimate(estimate: dict | None) -> dict | None:
    if not estimate:
        return None
    normalized = dict(estimate)
    created_at = normalized.get("created_at")
    if hasattr(created_at, "isoformat"):
        normalized["created_at"] = created_at.isoformat()
    return normalized


def _build_context(
    customer: dict | None,
    vehicle: dict | None,
    parts: list[dict],
    faults: list[dict],
    labor: list[dict],
    job_card: dict | None,
    estimate: dict | None,
    estimate_line_items: list[dict],
    question: str,
) -> SqlQuestionAnswerContext:
    customer_model = SqlUserDetails(**customer) if customer else None
    vehicle_model = SqlVehicleDetails(**vehicle) if vehicle else None
    parts_models = [SqlPartDetails(**item) for item in parts] if parts else None
    faults_models = [SqlFaultDetails(**item) for item in faults] if faults else None
    labor_models = [SqlLaborDetails(**item) for item in labor] if labor else None
    job_card_model = SqlJobCardDetails(**_normalize_job_card(job_card)) if job_card else None
    estimate_model = SqlEstimateDetails(**_normalize_estimate(estimate)) if estimate else None
    line_item_models = (
        [SqlEstimateLineItemDetails(**item) for item in estimate_line_items]
        if estimate_line_items
        else None
    )

    return SqlQuestionAnswerContext(
        question=question,
        matched_topics=[
            "customer",
            "vehicle",
            "parts",
            "faults",
            "labor",
            "job_card",
            "estimate",
            "estimate_line_items",
        ],
        customer=customer_model,
        vehicle=vehicle_model,
        parts=parts_models,
        faults=faults_models,
        labor=labor_models,
        job_card=job_card_model,
        estimate=estimate_model,
        estimate_line_items=line_item_models,
    )


def _extract_approval_action(question: str) -> str | None:
    q = question.lower()
    approve_hits = ["approve", "approved", "accept", "accepted"]
    reject_hits = ["reject", "rejected", "decline", "declined"]
    has_approve = any(hit in q for hit in approve_hits)
    has_reject = any(hit in q for hit in reject_hits)
    if has_approve and not has_reject:
        return "approved"
    if has_reject and not has_approve:
        return "rejected"
    return None


async def _collect_json(agent, user_input: str) -> str:
    full = ""
    async for event in agent.run(user_input, stream=True):
        if event.text:
            full += event.text
    return full.strip()


async def customer_db_tool(
    customer_id: str | None = None,
    job_card_id: str | None = None,
    vehicle_id: str | None = None,
    question: str | None = None,
) -> str:
    if not customer_id:
        empty_context = SqlQuestionAnswerContext(question=question or "", matched_topics=[])
        response = CustomerDbToolResult(
            answer="I don't have that information in the provided records.",
            context=empty_context,
        )
        return response.model_dump_json()

    if not job_card_id or not vehicle_id or not question:
        raise ValueError(
            "customer_db_tool requires customer_id, job_card_id, vehicle_id, and question."
        )

    repo = _get_repo()
    approval_action = _extract_approval_action(question)

    def _run() -> tuple[SqlQuestionAnswerContext, bool, bool]:
        customer = repo.get_customer_details(customer_id)
        vehicle = repo.get_vehicle_details(vehicle_id)
        job_card = repo.get_job_card_details(job_card_id)

        status_value = (job_card or {}).get("status") if job_card else None
        customer_match = True
        if job_card:
            job_card_customer = job_card.get("customer_id") or job_card.get("customerId")
            if job_card_customer:
                customer_match = str(job_card_customer) == str(customer_id)
        pending_approval = status_value == "pending_approval" and customer_match
        updated = False
        if pending_approval and approval_action:
            repo.update_job_card_status(job_card_id, approval_action)
            if job_card is not None:
                job_card["status"] = approval_action
            updated = True

        estimate = repo.get_estimate_by_job_card(job_card_id)
        estimate_line_items: list[dict] = []
        estimate_id = None
        if estimate:
            estimate_id = estimate.get("estimate_id") or estimate.get("id")
        if estimate_id:
            estimate_line_items = repo.get_estimate_line_items(estimate_id)

        part_ids: set[str] = set()
        labor_ids: set[str] = set()
        for item in estimate_line_items:
            item_type = (item.get("type") or "").lower()
            reference_id = (
                item.get("reference_id")
                or item.get("referenceId")
                or item.get("referenceID")
            )
            if item_type == "part" and reference_id:
                part_ids.add(str(reference_id))
            elif item_type == "labor" and reference_id:
                labor_ids.add(str(reference_id))

        parts = repo.get_parts_details(part_ids)
        labor = repo.get_labor_operations(labor_ids)

        raw_faults = None
        if job_card:
            raw_faults = job_card.get("obd_fault_codes") or job_card.get("fault_codes")
        fault_codes: list[str] = []
        if isinstance(raw_faults, list):
            fault_codes = [str(code) for code in raw_faults if code]
        elif isinstance(raw_faults, str):
            fault_codes = [code.strip() for code in raw_faults.split(",") if code.strip()]
        faults = repo.get_fault_code_details(fault_codes)

        return (
            _build_context(
            customer=customer,
            vehicle=vehicle,
            parts=parts,
            faults=faults,
            labor=labor,
            job_card=job_card,
            estimate=estimate,
            estimate_line_items=estimate_line_items,
            question=question,
            ),
            pending_approval,
            updated,
        )

    try:
        result, pending_approval, updated = await asyncio.to_thread(_run)
    except Exception as exc:
        raise RuntimeError("Failed to retrieve customer chat data from SQL.") from exc

    if pending_approval and not updated:
        response = CustomerDbToolResult(
            answer="Your job is pending approval. Please reply with 'approve' or 'reject'.",
            context=result,
        )
        return response.model_dump_json()

    if updated:
        response = CustomerDbToolResult(
            answer="Thanks. Your decision has been recorded.",
            context=result,
        )
        return response.model_dump_json()

    payload = {
        "question": question,
        "context": result.model_dump(),
    }
    raw = await _collect_json(customer_db_reasoner, json.dumps(payload))
    answer = CustomerDbAnswer.model_validate_json(raw)
    response = CustomerDbToolResult(answer=answer.answer, context=result)
    return response.model_dump_json()
