"""SQL knowledge tool for agents."""
from __future__ import annotations

import asyncio
import traceback
from typing import Iterable

from app.domain.schemas import (
    SqlFaultDetails,
    SqlLaborDetails,
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

def _normalize_fault_codes(codes: list[str] | None) -> list[str]:
    if not codes:
        return []
    return [c.split()[0].strip() for c in codes]

def _build_lookup_result(
    repo: SqlRepository,
    vehicle: dict | None,
    customer: dict | None,
    parts: Iterable[dict],
    fault_codes: list[str] | None
) -> SqlLookupResult:
    
    normalized_faults = _normalize_fault_codes(fault_codes)
    vehicle_model = SqlVehicleDetails(**vehicle) if vehicle else None
    customer_model = SqlUserDetails(**customer) if customer else None
    part_models = [SqlPartDetails(**part) for part in parts] if parts else None
    fault_dicts = repo.get_fault_code_details(normalized_faults)
    fault_models = [SqlFaultDetails(**f) for f in fault_dicts] if fault_dicts else None

    labor_ids = [
        f["labor_operation_id"]
        for f in fault_dicts
        if f.get("labor_operation_id")
    ]
    labor_dicts = repo.get_labor_operations(labor_ids)
    labor_models = [SqlLaborDetails(**l) for l in labor_dicts] if labor_dicts else None
    print("DEBUG NORMALIZED FAULTS:", normalized_faults)
    print("DEBUG FAULT DICTS:", fault_dicts)
    print("DEBUG LABOR DICTS:", labor_dicts)
    return SqlLookupResult(
        vehicle=vehicle_model, 
        customer=customer_model, 
        parts=part_models, 
        faults=fault_models, 
        labor=labor_models 
    )


async def sql_lookup_tool(
    vehicle_id: str | None = None,
    customer_id: str | None = None,
    user_id: str | None = None,
    part_codes: list[str] | None = None,
    fault_codes: list[str] | None = None
) -> str:
    try:
        repo = _get_repo()

        resolved_customer_id = customer_id or user_id

        def _run() -> SqlLookupResult:
            vehicle = repo.get_vehicle_details(vehicle_id) if vehicle_id else None
            print("DEBUG VEHICLE:", vehicle)
            customer = (
                repo.get_customer_details(resolved_customer_id)
                if resolved_customer_id
                else None
            )
            print("DEBUG CUSTOMER:", customer)
            parts = repo.get_parts_details(part_codes or [])
            print("DEBUG PARTS:", parts)
            return _build_lookup_result(repo, vehicle, customer, parts, fault_codes)

        result = await asyncio.to_thread(_run)
        print("DEBUG SQL_LOOKUP_TOOL RESULT:", result.model_dump_json())
        return result.model_dump_json()
    except Exception as e:
        print("=" * 60)
        print("ERROR IN sql_lookup_tool:")
        print(f"  vehicle_id={vehicle_id}")
        print(f"  customer_id={customer_id}")
        print(f"  fault_codes={fault_codes}")
        print(f"  part_codes={part_codes}")
        traceback.print_exc()
        print("=" * 60)
        raise