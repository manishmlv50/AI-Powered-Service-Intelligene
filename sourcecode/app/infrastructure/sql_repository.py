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
        if connection_string:
            connection_string = connection_string.strip().strip("\"").strip("'")
        if connection_string and "driver=" not in connection_string.lower():
            connection_string = (
                "Driver={ODBC Driver 18 for SQL Server};" + connection_string
            )
        if connection_string:
            parts = []
            for part in connection_string.split(";"):
                if not part:
                    continue
                key, sep, value = part.partition("=")
                if sep and key.strip().lower() == "initial catalog":
                    key = "Database"
                if sep and key.strip().lower() in {"encrypt", "trustservercertificate"}:
                    normalized = value.strip().lower()
                    if normalized == "true":
                        value = "yes"
                    elif normalized == "false":
                        value = "no"
                    part = f"{key}={value}"
                parts.append(part)
            connection_string = ";".join(parts) + ";"
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
        query_v2 = """
        SELECT TOP 1
            id AS vehicle_id,
            customer_id,
            make,
            model,
            year,
            vin
        FROM Vehicles
        WHERE id = :vehicle_id
        """
        query_v1 = """
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
        try:
            return self.fetch_one(query_v2, {"vehicle_id": vehicle_id})
        except Exception:
            return self.fetch_one(query_v1, {"vehicle_id": vehicle_id})

    def get_customer_details(self, customer_id: str) -> dict[str, Any] | None:
        query_v2 = """
        SELECT TOP 1
            id AS customer_id,
            name,
            phone,
            email,
            preferredContact AS preferred_contact
        FROM Customers
        WHERE id = :customer_id
        """
        query_v1 = """
        SELECT TOP 1
            id AS customer_id,
            name,
            phone,
            email,
            preferred_contact
        FROM Customers
        WHERE id = :customer_id
        """
        try:
            return self.fetch_one(query_v2, {"customer_id": customer_id})
        except Exception:
            return self.fetch_one(query_v1, {"customer_id": customer_id})

    def get_parts_details(self, part_codes: Iterable[str]) -> list[dict[str, Any]]:
        if not part_codes:
            return []
        query_v2 = text(
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
        query_v1 = text(
            """
            SELECT
                id AS part_id,
                part_code,
                part_description AS description,
                unit_price,
                category
            FROM Parts
            WHERE part_code IN :part_codes OR id IN :part_codes
            """
        ).bindparams(bindparam("part_codes", expanding=True))
        query_v0 = text(
            """
            SELECT
                id AS part_id,
                NULL AS part_code,
                NULL AS description,
                NULL AS unit_price,
                NULL AS category
            FROM Parts
            WHERE id IN :part_codes
            """
        ).bindparams(bindparam("part_codes", expanding=True))
        with self.engine.connect() as conn:
            try:
                rows = conn.execute(query_v2, {"part_codes": list(part_codes)}).mappings().all()
            except Exception:
                try:
                    rows = conn.execute(query_v1, {"part_codes": list(part_codes)}).mappings().all()
                except Exception:
                    rows = conn.execute(query_v0, {"part_codes": list(part_codes)}).mappings().all()
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
        query_v2 = """
        SELECT TOP 1
            id AS vehicle_id,
            customer_id,
            make,
            model,
            year,
            vin
        FROM Vehicles
        WHERE registration_number = :registration_number
        """
        query_v1 = """
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
        try:
            return self.fetch_one(query_v2, {"registration_number": registration_number})
        except Exception:
            return self.fetch_one(query_v1, {"registration_number": registration_number})
    
    def get_labor_operations(self, labor_ids: Iterable[str]) -> list[dict[str, Any]]:
        if not labor_ids:
            return []

        query_v2 = text(
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

        query_v1 = text(
            """
            SELECT
                id AS labor_id,
                name,
                hourly_rate,
                estimated_hours
            FROM Labor_Operations
            WHERE id IN :labor_ids
            """
        ).bindparams(bindparam("labor_ids", expanding=True))

        with self.engine.connect() as conn:
            try:
                rows = conn.execute(query_v2, {"labor_ids": list(labor_ids)}).mappings().all()
            except Exception:
                rows = conn.execute(query_v1, {"labor_ids": list(labor_ids)}).mappings().all()
            return [dict(row) for row in rows]

    def get_job_card_details(self, job_card_id: str) -> dict[str, Any] | None:
        query_v2 = """
        SELECT TOP 1
            id AS job_card_id,
            customer_id,
            vehicle_id,
            status,
            created_at,
            complaint,
            service_type,
            mileage,
            risk_indicators,
            advisor_id,
            intake_payload_json
        FROM Job_Cards
        WHERE id = :job_card_id
        """
        query_v1 = """
        SELECT TOP 1
            id AS job_card_id,
            customerId AS customer_id,
            vehicleId AS vehicle_id,
            status,
            createdAt AS created_at,
            complaint,
            serviceType AS service_type,
            mileage,
            riskIndicators AS risk_indicators,
            advisorId AS advisor_id,
            intakePayloadJson AS intake_payload_json
        FROM Job_Cards
        WHERE id = :job_card_id
        """
        query_v0 = """
        SELECT TOP 1
            id AS job_card_id,
            customer_id,
            vehicle_id,
            status,
            created_at,
            complaint,
            service_type,
            mileage,
            risk_indicators,
            advisor_id,
            intake_payload_json
        FROM Job_Cards
        WHERE id = :job_card_id
        """
        try:
            return self.fetch_one(query_v2, {"job_card_id": job_card_id})
        except Exception:
            try:
                return self.fetch_one(query_v1, {"job_card_id": job_card_id})
            except Exception:
                return self.fetch_one(query_v0, {"job_card_id": job_card_id})

    def update_job_card_status(self, job_card_id: str, status: str) -> None:
        query_v2 = """
        UPDATE Job_Cards
        SET status = :status
        WHERE id = :job_card_id
        """
        query_v1 = """
        UPDATE Job_Cards
        SET status = :status
        WHERE id = :job_card_id
        """
        query_v0 = """
        UPDATE JobCards
        SET status = :status
        WHERE id = :job_card_id
        """
        params = {"job_card_id": job_card_id, "status": status}
        with self.engine.begin() as conn:
            try:
                conn.execute(text(query_v2), params)
            except Exception:
                try:
                    conn.execute(text(query_v1), params)
                except Exception:
                    conn.execute(text(query_v0), params)

    def get_estimate_by_job_card(self, job_card_id: str) -> dict[str, Any] | None:
        query_v2 = """
        SELECT TOP 1
            id AS estimate_id,
            job_card_id,
            created_at,
            status,
            parts_total,
            labor_total,
            tax,
            grand_total AS total_amount
        FROM Estimates
        WHERE job_card_id = :job_card_id
        ORDER BY created_at DESC
        """
        query_v1 = """
        SELECT TOP 1
            id AS estimate_id,
            jobCardId AS job_card_id,
            createdAt AS created_at,
            status,
            subtotal,
            customerPayableAmount AS customer_payable_amount,
            insurancePayableAmount AS insurance_payable_amount,
            totalAmount AS total_amount
        FROM Estimates
        WHERE jobCardId = :job_card_id
        ORDER BY createdAt DESC
        """
        try:
            return self.fetch_one(query_v2, {"job_card_id": job_card_id})
        except Exception:
            return self.fetch_one(query_v1, {"job_card_id": job_card_id})

    def get_estimate_line_items(self, estimate_id: str) -> list[dict[str, Any]]:
        if not estimate_id:
            return []
        query_v2 = """
        SELECT
            id AS line_item_id,
            estimate_id,
            type,
            reference_id,
            quantity,
            unit_price,
            total
        FROM Estimate_Line_Items
        WHERE estimate_id = :estimate_id
        """
        query_v1 = """
        SELECT
            id AS line_item_id,
            estimateId AS estimate_id,
            description,
            quantity,
            unitPrice AS unit_price,
            hours,
            ratePerHour AS rate_per_hour,
            total
        FROM Estimate_Line_Items
        WHERE estimateId = :estimate_id
        """
        try:
            return self.fetch_all(query_v2, {"estimate_id": estimate_id})
        except Exception:
            return self.fetch_all(query_v1, {"estimate_id": estimate_id})


