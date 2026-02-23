"""SQL knowledge tool for agents."""
from __future__ import annotations

import asyncio
from typing import Iterable

from app.domain.schemas import (
    SqlLookupResult,
    SqlPartDetails,
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


def _build_lookup_result(
    vehicle: dict | None,
    customer: dict | None,
    parts: Iterable[dict],
) -> SqlLookupResult:
    vehicle_model = SqlVehicleDetails(**vehicle) if vehicle else None
    customer_model = SqlUserDetails(**customer) if customer else None
    part_models = [SqlPartDetails(**part) for part in parts] if parts else None
    return SqlLookupResult(vehicle=vehicle_model, customer=customer_model, parts=part_models)


async def sql_lookup_tool(
    vehicle_id: str | None = None,
    customer_id: str | None = None,
    user_id: str | None = None,
    part_codes: list[str] | None = None,
) -> str:
    repo = _get_repo()

    resolved_customer_id = customer_id or user_id

    def _run() -> SqlLookupResult:
        vehicle = repo.get_vehicle_details(vehicle_id) if vehicle_id else None
        customer = (
            repo.get_customer_details(resolved_customer_id)
            if resolved_customer_id
            else None
        )
        parts = repo.get_parts_details(part_codes or [])
        return _build_lookup_result(vehicle, customer, parts)

    result = await asyncio.to_thread(_run)
    return result.model_dump_json()
