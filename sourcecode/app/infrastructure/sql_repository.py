"""SQL repository for knowledge lookups."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable
from urllib.parse import quote_plus

from sqlalchemy import bindparam, create_engine, text
from sqlalchemy.engine import Engine

from app.config.settings import get_sql_connection_string


@dataclass
class SqlRepository:
    engine: Engine

    @classmethod
    def from_env(cls) -> "SqlRepository":
        connection_string = get_sql_connection_string()
        odbc = quote_plus(connection_string)
        url = f"mssql+pyodbc:///?odbc_connect={odbc}"
        engine = create_engine(url, pool_pre_ping=True)
        return cls(engine=engine)

    def fetch_one(self, query: str, params: dict[str, Any]) -> dict[str, Any] | None:
        with self.engine.connect() as conn:
            result = conn.execute(text(query), params).mappings().first()
            return dict(result) if result else None

    def fetch_all(self, query: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        with self.engine.connect() as conn:
            rows = conn.execute(text(query), params).mappings().all()
            return [dict(row) for row in rows]

    def get_vehicle_details(self, vehicle_id: str) -> dict[str, Any] | None:
        query = """
        SELECT TOP 1
            id AS vehicle_id,
            customerId AS customer_id,
            make,
            model,
            year,
            vin
        FROM Vehicles
        WHERE id = :vehicle_id
        """
        return self.fetch_one(query, {"vehicle_id": vehicle_id})

    def get_customer_details(self, customer_id: str) -> dict[str, Any] | None:
        query = """
        SELECT TOP 1
            id AS customer_id,
            name,
            phone,
            email,
            preferredContact AS preferred_contact
        FROM Customers
        WHERE id = :customer_id
        """
        return self.fetch_one(query, {"customer_id": customer_id})

    def get_parts_details(self, part_codes: Iterable[str]) -> list[dict[str, Any]]:
        if not part_codes:
            return []
        query = text(
            """
            SELECT
                id AS part_id,
                code AS part_code,
                description,
                unitPrice AS unit_price,
                category
            FROM Parts
            WHERE code IN :part_codes OR id IN :part_codes
            """
        ).bindparams(bindparam("part_codes", expanding=True))
        with self.engine.connect() as conn:
            rows = conn.execute(query, {"part_codes": list(part_codes)}).mappings().all()
            return [dict(row) for row in rows]
    
    def get_fault_code_details(self, fault_codes: Iterable[str]) -> list[dict[str, Any]]:
        if not fault_codes:
            return []

        query = text(
            """
            SELECT
                faultCode AS fault_code,
                description,
                laborOperationId AS labor_operation_id,
                warrantyEligible AS warranty_eligible
            FROM FaultCodes
            WHERE faultCode IN :fault_codes
            """
        ).bindparams(bindparam("fault_codes", expanding=True))

        with self.engine.connect() as conn:
            rows = conn.execute(query, {"fault_codes": list(fault_codes)}).mappings().all()
            return [dict(row) for row in rows]
        
    def get_vehicle_by_registration(self, registration_number: str) -> dict[str, Any] | None:
        query = """
        SELECT TOP 1
            id AS vehicle_id,
            customerId AS customer_id,
            make,
            model,
            year,
            vin
        FROM Vehicles
        WHERE registration_number = :registration_number
        """
        return self.fetch_one(query, {"registration_number": registration_number})
    
    def get_labor_operations(self, labor_ids: Iterable[str]) -> list[dict[str, Any]]:
        if not labor_ids:
            return []

        query = text(
            """
            SELECT
                id AS labor_id,
                name,
                hourlyRate AS hourly_rate,
                estimatedHours AS estimated_hours
            FROM LaborOperations
            WHERE id IN :labor_ids
            """
        ).bindparams(bindparam("labor_ids", expanding=True))

        with self.engine.connect() as conn:
            rows = conn.execute(query, {"labor_ids": list(labor_ids)}).mappings().all()
            return [dict(row) for row in rows]


