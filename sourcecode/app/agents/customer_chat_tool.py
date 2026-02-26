"""Customer chat SQL tool for communication agent."""
from __future__ import annotations

import asyncio
from typing import Iterable

from app.domain.schemas import (
    SqlEstimateDetails,
    SqlEstimateLineItemDetails,
    SqlJobCardDetails,
    SqlQuestionAnswerContext,
    SqlUserDetails,
    SqlVehicleDetails,
)
from app.infrastructure.sql_repository import SqlRepository

_repo: SqlRepository | None = None


def _get_repo() -> SqlRepository:
    global _repo
    if _repo is None:
        _repo = SqlRepository.from_env()
    return _repo


def _has_any(question: str, keywords: Iterable[str]) -> bool:
    return any(keyword in question for keyword in keywords)


def _detect_topics(question: str) -> set[str]:
    q = question.lower()
    topics: set[str] = set()

    if _has_any(q, ["customer", "name", "phone", "email", "contact", "preferred contact"]):
        topics.add("customer")
    if _has_any(q, ["vehicle", "car", "vin", "make", "model", "year", "mileage", "registration", "plate"]):
        topics.add("vehicle")
    if _has_any(
        q,
        [
            "job card",
            "jobcard",
            "job",
            "status",
            "progress",
            "stage",
            "complaint",
            "service",
            "advisor",
            "risk",
            "obd",
            "fault",
            "code",
        ],
    ):
        topics.add("job_card")
    if _has_any(
        q,
        [
            "estimate",
            "cost",
            "price",
            "total",
            "approval",
            "approved",
            "rejected",
            "pending",
            "labor",
            "parts",
            "tax",
            "grand total",
            "payable",
            "amount",
        ],
    ):
        topics.add("estimate")
    if _has_any(q, ["line item", "line items", "itemized", "breakdown", "parts", "labor"]):
        topics.add("estimate_line_items")

    if not topics:
        topics.update({"customer", "vehicle", "job_card", "estimate", "estimate_line_items"})

    if "estimate_line_items" in topics:
        topics.add("estimate")

    return topics


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


def _build_context(
    customer: dict | None,
    vehicle: dict | None,
    job_card: dict | None,
    estimate: dict | None,
    estimate_line_items: list[dict],
    question: str,
    matched_topics: list[str],
) -> SqlQuestionAnswerContext:
    customer_model = SqlUserDetails(**customer) if customer else None
    vehicle_model = SqlVehicleDetails(**vehicle) if vehicle else None
    job_card_model = SqlJobCardDetails(**_normalize_job_card(job_card)) if job_card else None
    estimate_model = SqlEstimateDetails(**estimate) if estimate else None
    line_item_models = (
        [SqlEstimateLineItemDetails(**item) for item in estimate_line_items]
        if estimate_line_items
        else None
    )

    return SqlQuestionAnswerContext(
        question=question,
        matched_topics=matched_topics,
        customer=customer_model,
        vehicle=vehicle_model,
        job_card=job_card_model,
        estimate=estimate_model,
        estimate_line_items=line_item_models,
    )


async def customer_chat_tool(
    customer_id: str | None = None,
    job_card_id: str | None = None,
    vehicle_id: str | None = None,
    question: str | None = None,
) -> str:
    if not customer_id or not job_card_id or not vehicle_id or not question:
        raise ValueError(
            "customer_chat_tool requires customer_id, job_card_id, vehicle_id, and question."
        )

    repo = _get_repo()
    topics = _detect_topics(question)

    def _run() -> SqlQuestionAnswerContext:
        customer = repo.get_customer_details(customer_id) if "customer" in topics else None
        vehicle = repo.get_vehicle_details(vehicle_id) if "vehicle" in topics else None
        job_card = repo.get_job_card_details(job_card_id) if "job_card" in topics else None

        estimate = None
        estimate_line_items: list[dict] = []
        if "estimate" in topics:
            estimate = repo.get_estimate_by_job_card(job_card_id)
            estimate_id = None
            if estimate:
                estimate_id = estimate.get("estimate_id") or estimate.get("id")
            if estimate_id and "estimate_line_items" in topics:
                estimate_line_items = repo.get_estimate_line_items(estimate_id)

        return _build_context(
            customer=customer,
            vehicle=vehicle,
            job_card=job_card,
            estimate=estimate,
            estimate_line_items=estimate_line_items,
            question=question,
            matched_topics=sorted(topics),
        )

    try:
        result = await asyncio.to_thread(_run)
    except Exception as exc:
        raise RuntimeError("Failed to retrieve customer chat data from SQL.") from exc

    return result.model_dump_json()
