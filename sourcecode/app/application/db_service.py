"""Azure SQL service layer — v2 schema (aligned to JSON fixtures).

Column names match create_mvp_tables_v2.sql exactly:
  - snake_case throughout
  - Short string IDs (J001, C001 etc.) — NVARCHAR(20)
  - Job_Cards stores customer_name / vehicle_* inline (denormalized)
  - Estimates uses parts_total / labor_total / tax / grand_total
  - Estimate_Line_Items has type (part|labor) + reference_id

Fallback to synthetic JSON data is ONLY active when USE_JSON_FALLBACK=true in .env.
"""
from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger("uvicorn.error")

# ─── Config ───────────────────────────────────────────────────────────────────

def _use_json_fallback() -> bool:
    return os.getenv("USE_JSON_FALLBACK", "false").lower() == "true"

# ─── JSON fixture loader ──────────────────────────────────────────────────────

_DATA_DIR = Path(__file__).parent.parent.parent.parent / "docs" / "backend" / "data"
_json_store: dict[str, list[dict]] = {}

def _load(filename: str) -> list[dict]:
    path = _DATA_DIR / filename
    if path.exists():
        try:
            content = path.read_text(encoding="utf-8").strip()
            if not content:
                return []
            return json.loads(content)
        except json.JSONDecodeError as exc:
            logger.warning(f"⚠️  Could not parse {filename}: {exc} — using empty list")
    return []

def _json(key: str, filename: str) -> list[dict]:
    if key not in _json_store:
        _json_store[key] = _load(filename)
    return _json_store[key]

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _new_id() -> str:
    return str(uuid.uuid4())[:8].upper()

# ─── ODBC connection ──────────────────────────────────────────────────────────

_ODBC_DRIVERS = [
    "ODBC Driver 18 for SQL Server",
    "ODBC Driver 17 for SQL Server",
    "ODBC Driver 13 for SQL Server",
    "SQL Server",
]
_conn = None

def _parse_ado_parts() -> Optional[dict]:
    cs = os.getenv("AZURE_SQL_CONNECTION_STRING", "").strip()
    if not cs:
        return None
    parts: dict[str, str] = {}
    for seg in cs.split(";"):
        seg = seg.strip()
        if "=" in seg:
            k, v = seg.split("=", 1)
            parts[k.strip()] = v.strip()
    return parts or None

def _build_odbc_str(driver: str) -> Optional[str]:
    parts = _parse_ado_parts()
    if not parts:
        return None
    server   = parts.get("Server", "").replace("tcp:", "")
    database = parts.get("Database") or parts.get("Initial Catalog", "")
    uid      = parts.get("Uid") or parts.get("User ID", "")
    pwd      = parts.get("Pwd") or parts.get("Password", "")
    encrypt  = "yes" if parts.get("Encrypt", "True").lower() in ("true", "yes") else "no"
    trust    = "yes" if parts.get("TrustServerCertificate", "False").lower() in ("true", "yes") else "no"
    return (
        f"DRIVER={{{driver}}};SERVER={server};DATABASE={database};"
        f"UID={uid};PWD={pwd};"
        f"Encrypt={encrypt};TrustServerCertificate={trust};Connection Timeout=30;"
        f"MARS_Connection=yes;"  # allow multiple active result sets on one connection
    )

def _get_conn():
    global _conn
    if not _parse_ado_parts():
        return None
    if _conn is not None:
        try:
            _conn.execute("SELECT 1")
            return _conn
        except Exception:
            _conn = None
    try:
        import pyodbc
        for driver in _ODBC_DRIVERS:
            odbc_str = _build_odbc_str(driver)
            if not odbc_str:
                continue
            try:
                c = pyodbc.connect(odbc_str, timeout=10)
                c.autocommit = True
                _conn = c
                logger.info(f"✅ Azure SQL connected via [{driver}]")
                return _conn
            except pyodbc.Error:
                continue
        logger.warning("⚠️  No suitable ODBC driver — install 'ODBC Driver 18' from https://aka.ms/odbc18")
        return None
    except ImportError:
        logger.warning("⚠️  pyodbc not installed — pip install pyodbc")
        return None
    except Exception as exc:
        logger.warning(f"⚠️  Azure SQL error: {exc}")
        return None

def _db_available() -> bool:
    return _get_conn() is not None

def _sql_rows(query: str, params: tuple = ()) -> list[dict]:
    conn = _get_conn()
    if not conn:
        return []
    cur = None
    try:
        cur = conn.cursor()
        cur.execute(query, params)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        return rows
    except Exception as exc:
        logger.warning(f"⚠️  SQL query failed: {exc}")
        return []
    finally:
        if cur:
            try: cur.close()
            except Exception: pass

def _sql_exec(query: str, params: tuple = ()) -> bool:
    conn = _get_conn()
    if not conn:
        return False
    try:
        conn.execute(query, params)
        return True
    except Exception as exc:
        logger.warning(f"⚠️  SQL exec failed: {exc}")
        return False

# ─── Column mappers (v2 schema) ───────────────────────────────────────────────

def _split_csv(v) -> list:
    """Turn a comma-separated string or list into a list."""
    if not v:
        return []
    if isinstance(v, list):
        return v
    return [x.strip() for x in str(v).split(",") if x.strip()]

def _map_job(row: dict) -> dict:
    """Map v2 Job_Cards row → internal dict (camelCase for FE compatibility)."""
    tasks_raw = row.get("tasks")
    payload_raw = row.get("intake_payload_json")
    tasks = [t.strip() for t in str(tasks_raw or "").splitlines() if t and t.strip()]
    intake_payload = None
    if payload_raw:
        try:
            intake_payload = json.loads(payload_raw) if isinstance(payload_raw, str) else payload_raw
        except Exception:
            intake_payload = None

    return {
        "id":             row.get("id", ""),
        "createdAt":      str(row.get("created_at", "")),
        "status":         row.get("status", "draft"),
        "customerName":   row.get("customer_name"),
        "customerId":     row.get("customer_id"),
        "vehicleMake":    row.get("vehicle_make"),
        "vehicleModel":   row.get("vehicle_model"),
        "vehicleYear":    row.get("vehicle_year"),
        "vin":            row.get("vin"),
        "mileage":        row.get("mileage"),
        "complaint":      row.get("complaint"),
        "serviceType":    row.get("service_type"),
        "riskIndicators": _split_csv(row.get("risk_indicators")),
        "obdFaultCodes":  _split_csv(row.get("obd_fault_codes")),
        "obdDocumentId":  row.get("obd_document_id"),
        "obdReportText":  row.get("obd_report_text"),
        "obdReportSummary": row.get("obd_report_summary"),
        "tasks":          tasks,
        "intakePayloadJson": intake_payload,
        "vehicleId":      row.get("vehicle_id"),
        "advisorId":      row.get("advisor_id"),
    }

def _map_est(row: dict) -> dict:
    estimation_json_raw = row.get("estimation_json")
    estimation_json = None
    if estimation_json_raw:
        if isinstance(estimation_json_raw, (dict, list)):
            estimation_json = estimation_json_raw
        elif isinstance(estimation_json_raw, str):
            try:
                estimation_json = json.loads(estimation_json_raw)
            except Exception:
                estimation_json = estimation_json_raw

    return {
        "id":          row.get("id", ""),
        "job_card_id": row.get("job_card_id", ""),
        "createdAt":   str(row.get("created_at", "")),
        "status":      row.get("status", "pending"),
        "parts_total": float(row.get("parts_total") or 0),
        "labor_total": float(row.get("labor_total") or 0),
        "tax":         float(row.get("tax") or 0),
        "grand_total": float(row.get("grand_total") or 0),
        "estimation_json": estimation_json,
        "lineItems":   [],
    }

def _map_customer(row: dict) -> dict:
    return {
        "id":               row.get("id", ""),
        "name":             row.get("name", ""),
        "phone":            row.get("phone"),
        "email":            row.get("email"),
        "city":             row.get("city"),
        "state":            row.get("state"),
        "preferred_contact":row.get("preferred_contact", "chatbot"),
    }

def _map_vehicle(row: dict) -> dict:
    return {
        "id":                  row.get("id", ""),
        "customerId":          row.get("customer_id", ""),
        "make":                row.get("make", ""),
        "model":               row.get("model", ""),
        "year":                row.get("year"),
        "fuel_type":           row.get("fuel_type"),
        "transmission":        row.get("transmission"),
        "registration_number": row.get("registration_number"),
        "vin":                 row.get("vin"),
    }

# Job_Cards SELECT — uses v2 column names
_JC_SELECT = "SELECT * FROM Job_Cards"

# ─── Job Cards ────────────────────────────────────────────────────────────────

def list_job_cards(status: Optional[str] = None, advisor_id: Optional[str] = None) -> list[dict]:
    if _db_available():
        where, params = [], []
        if status:
            where.append("status = ?"); params.append(status)
        if advisor_id:
            where.append("advisor_id = ?"); params.append(advisor_id)
        clause = ("WHERE " + " AND ".join(where)) if where else ""
        rows = _sql_rows(f"{_JC_SELECT} {clause} ORDER BY created_at DESC", tuple(params))
        return [_map_job(r) for r in rows]

    if _use_json_fallback():
        jcs = list(_json("job_cards", "job_cards.json"))
        if status:
            jcs = [j for j in jcs if j.get("status") == status]
        if advisor_id:
            jcs = [j for j in jcs if j.get("advisorId") == advisor_id]
        return sorted(jcs, key=lambda j: j.get("createdAt", ""), reverse=True)
    return []

def get_job_card(job_id: str) -> Optional[dict]:
    if _db_available():
        rows = _sql_rows(f"{_JC_SELECT} WHERE id = ?", (job_id,))
        return _map_job(rows[0]) if rows else None
    if _use_json_fallback():
        return next((j for j in _json("job_cards", "job_cards.json") if j["id"] == job_id), None)
    return None

def create_job_card(data: dict) -> dict:
    import time, random, string as _string
    if data.get("id"):
        jc_id = data["id"]
    else:
        # Timestamp-based ID — avoids a DB count query before INSERT on the same connection
        ts   = int(time.time() * 1000) % 100000
        rand = ''.join(random.choices(_string.ascii_uppercase, k=2))
        jc_id = f"J{ts}{rand}"

    now      = _now()
    risk_str = ",".join(data.get("risk_indicators") or [])
    obd_str  = ",".join(data.get("obd_fault_codes")  or [])
    tasks_list = data.get("tasks") or []
    tasks_str = "\n".join([str(task).strip() for task in tasks_list if str(task).strip()])

    intake_payload = data.get("intake_payload_json")
    if intake_payload is None:
        make_model = data.get("make_model")
        if not make_model:
            make_model = " ".join([
                str(data.get("vehicle_make") or "").strip(),
                str(data.get("vehicle_model") or "").strip(),
                str(data.get("vehicle_year") or "").strip(),
            ]).strip()
        intake_payload = {
            "agent": data.get("agent"),
            "service_type": data.get("service_type"),
            "job_card": {
                "vehicle_id": data.get("vehicle_id"),
                "make_model": make_model,
                "complaint": data.get("complaint"),
                "obd_codes": data.get("obd_fault_codes") or [],
                "tasks": tasks_list,
            },
        }
    intake_payload_str = None
    if intake_payload is not None:
        try:
            intake_payload_str = json.dumps(intake_payload, ensure_ascii=False)
        except Exception:
            intake_payload_str = None

    if _db_available():
        ok = _sql_exec(
            """INSERT INTO Job_Cards
               (id, created_at, status, customer_name, vehicle_make, vehicle_model, vehicle_year,
                vin, mileage, complaint, service_type, risk_indicators, obd_fault_codes,
                obd_document_id, obd_report_text, obd_report_summary, tasks, intake_payload_json,
                customer_id, vehicle_id, advisor_id)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (jc_id, now, "draft",
             data.get("customer_name"), data.get("vehicle_make"), data.get("vehicle_model"),
             data.get("vehicle_year"), data.get("vin"), data.get("mileage"),
             data.get("complaint"), data.get("service_type"),
             risk_str, obd_str, data.get("obd_document_id"), data.get("obd_report_text"),
             data.get("obd_report_summary"), tasks_str, intake_payload_str,
             data.get("customer_id"), data.get("vehicle_id"), data.get("advisor_id"))
        )
        if ok:
            fetched = get_job_card(jc_id)
            if fetched:
                return fetched
    # In-memory fallback
    jc = {
        **data, "id": jc_id, "createdAt": now, "status": "draft",
        "riskIndicators": data.get("risk_indicators", []),
        "obdFaultCodes":  data.get("obd_fault_codes", []),
        "obdReportText":  data.get("obd_report_text"),
        "obdReportSummary":  data.get("obd_report_summary"),
        "tasks": [str(task).strip() for task in tasks_list if str(task).strip()],
        "intake_payload_json": intake_payload,
    }
    if _use_json_fallback():
        _json("job_cards", "job_cards.json").append(jc)
    return jc

def update_job_card(job_id: str, data: dict) -> Optional[dict]:
    col_map = {
        "complaint":   "complaint",  "service_type": "service_type",
        "mileage":     "mileage",    "status":        "status",
        "risk_indicators": "risk_indicators", "obd_fault_codes": "obd_fault_codes",
        "obd_report_text": "obd_report_text", "obd_report_summary": "obd_report_summary",
    }
    if _db_available():
        sets, params = [], []
        for py_key, col in col_map.items():
            val = data.get(py_key)
            if val is not None:
                sets.append(f"{col} = ?")
                params.append(",".join(val) if isinstance(val, list) else val)
        if sets:
            params.append(job_id)
            _sql_exec(f"UPDATE Job_Cards SET {', '.join(sets)} WHERE id = ?", tuple(params))
        return get_job_card(job_id)
    if _use_json_fallback():
        for jc in _json("job_cards", "job_cards.json"):
            if jc["id"] == job_id:
                jc.update({k: v for k, v in data.items() if v is not None})
                return jc
    return None

def update_job_card_status(job_id: str, status: str) -> Optional[dict]:
    return update_job_card(job_id, {"status": status})

def delete_job_card(job_id: str) -> bool:
    return update_job_card(job_id, {"status": "closed"}) is not None

# ─── Estimates ────────────────────────────────────────────────────────────────

def get_estimate_by_job(job_card_id: str) -> Optional[dict]:
    if _db_available():
        rows = _sql_rows("SELECT * FROM Estimates WHERE job_card_id = ?", (job_card_id,))
        if rows:
            est = _map_est(rows[0])
            est["lineItems"] = _sql_rows(
                "SELECT * FROM Estimate_Line_Items WHERE estimate_id = ?", (est["id"],)
            )
            return est
    if _use_json_fallback():
        est = next((e for e in _json("estimates", "estimates.json") if e.get("job_card_id") == job_card_id), None)
        if est:
            est["lineItems"] = [li for li in _json("eli", "estimate_line_item.json") if li.get("estimate_id") == est.get("id")]
        return est
    return None

def get_estimate(estimate_id: str) -> Optional[dict]:
    if _db_available():
        rows = _sql_rows("SELECT * FROM Estimates WHERE id = ?", (estimate_id,))
        if rows:
            est = _map_est(rows[0])
            est["lineItems"] = _sql_rows(
                "SELECT * FROM Estimate_Line_Items WHERE estimate_id = ?", (est["id"],)
            )
            return est
    if _use_json_fallback():
        est = next((e for e in _json("estimates", "estimates.json") if e["id"] == estimate_id), None)
        if est:
            est["lineItems"] = [li for li in _json("eli", "estimate_line_item.json") if li.get("estimate_id") == estimate_id]
        return est
    return None

def create_estimate(job_card_id: str, data: dict) -> dict:
    estimate_payload = data.get("estimate") if isinstance(data.get("estimate"), dict) else data
    estimation_json_obj = data.get("estimation_json")
    if estimation_json_obj is None:
        estimation_json_obj = estimate_payload

    try:
        estimation_json_str = json.dumps(estimation_json_obj, ensure_ascii=False)
    except Exception:
        estimation_json_str = None

    est_id = f"E{len(_json('estimates','estimates.json'))+1:03d}" if _use_json_fallback() else _new_id()
    now = _now()
    est = {
        "id": est_id,
        "job_card_id": job_card_id,
        "createdAt": now,
        "status": "pending",
        "parts_total": estimate_payload.get("parts_total", 0),
        "labor_total": estimate_payload.get("labor_total", estimate_payload.get("labour_total", 0)),
        "tax": estimate_payload.get("tax", 0),
        "grand_total": estimate_payload.get("grand_total", estimate_payload.get("total_amount", 0)),
        "estimation_json": estimation_json_obj,
        "lineItems": estimate_payload.get("line_items") or estimate_payload.get("lineItems") or [],
    }
    if _db_available():
        existing_rows = _sql_rows("SELECT id, status FROM Estimates WHERE job_card_id = ?", (job_card_id,))
        if existing_rows:
            existing_id = existing_rows[0].get("id")
            existing_status = existing_rows[0].get("status") or "pending"
            est["id"] = existing_id
            est["status"] = existing_status
            ok = _sql_exec(
                """UPDATE Estimates
                   SET parts_total = ?, labor_total = ?, tax = ?, grand_total = ?, estimation_json = ?
                   WHERE id = ?""",
                (est["parts_total"], est["labor_total"], est["tax"], est["grand_total"], estimation_json_str, existing_id)
            )
            if ok:
                return get_estimate(existing_id) or est
        else:
            ok = _sql_exec(
                """INSERT INTO Estimates (id, job_card_id, status, parts_total, labor_total, tax, grand_total, estimation_json)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (est_id, job_card_id, "pending",
                 est["parts_total"], est["labor_total"], est["tax"], est["grand_total"], estimation_json_str)
            )
            if ok:
                return get_estimate(est_id) or est
    if _use_json_fallback():
        existing = next((e for e in _json("estimates", "estimates.json") if e.get("job_card_id") == job_card_id), None)
        if existing:
            existing_status = existing.get("status", "pending")
            existing.update({
                "parts_total": est["parts_total"],
                "labor_total": est["labor_total"],
                "tax": est["tax"],
                "grand_total": est["grand_total"],
                "estimation_json": est["estimation_json"],
                "lineItems": est["lineItems"],
            })
            existing["status"] = existing_status
            return existing
        _json("estimates", "estimates.json").append(est)
    return est

def update_estimate_status(estimate_id: str, status: str) -> Optional[dict]:
    if _db_available():
        _sql_exec("UPDATE Estimates SET status = ? WHERE id = ?", (status, estimate_id))
        return get_estimate(estimate_id)
    if _use_json_fallback():
        for est in _json("estimates", "estimates.json"):
            if est["id"] == estimate_id:
                est["status"] = status
                return est
    return None

# ─── Estimates ────────────────────────────────────────────────────────────────

def get_all_estimates_with_job() -> list[dict]:
    results = []

    # SQL MODE
    if _db_available():
        rows = _sql_rows("SELECT * FROM Estimates", ())

        for r in rows:
            est = _map_est(r)

            # # attach line items (same pattern you already use)
            # est["lineItems"] = _sql_rows(
            #     "SELECT * FROM Estimate_Line_Items WHERE estimate_id = ?",
            #     (est["id"],)
            # )

            # Only include if estimate exists (extra safety)
            if est.get("job_card_id"):
                results.append(est)

        return results

# ─── Customers ────────────────────────────────────────────────────────────────

def get_customer(customer_id: str) -> Optional[dict]:
    if _db_available():
        rows = _sql_rows("SELECT * FROM Customers WHERE id = ?", (customer_id,))
        return _map_customer(rows[0]) if rows else None
    if _use_json_fallback():
        return next((c for c in _json("customers", "customers.json") if c["id"] == customer_id), None)
    return None

def list_customers() -> list[dict]:
    if _db_available():
        rows = _sql_rows("SELECT * FROM Customers ORDER BY name", ())
        return [_map_customer(r) for r in rows]
    if _use_json_fallback():
        return list(_json("customers", "customers.json"))
    return []

def get_customer_vehicles(customer_id: str) -> list[dict]:
    if _db_available():
        rows = _sql_rows("SELECT * FROM Vehicles WHERE customer_id = ?", (customer_id,))
        return [_map_vehicle(r) for r in rows]
    if _use_json_fallback():
        return [v for v in _json("vehicles", "vehicles.json") if v.get("customer_id") == customer_id]
    return []

def search_vehicle_by_number(query: str) -> Optional[dict]:
    """Search by VIN or registration_number (partial match). Returns vehicle + owner."""
    q = query.strip().upper()
    if _db_available():
        rows = _sql_rows(
            "SELECT v.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email "
            "FROM Vehicles v JOIN Customers c ON c.id = v.customer_id "
            "WHERE UPPER(v.registration_number) LIKE ? OR UPPER(v.vin) LIKE ?",
            (f"%{q}%", f"%{q}%")
        )
        if rows:
            r = rows[0]
            return {"found": True, **_map_vehicle(r),
                    "customer_id":    r.get("customer_id"),
                    "customer_name":  r.get("customer_name"),
                    "customer_phone": r.get("customer_phone"),
                    "customer_email": r.get("customer_email")}
    if _use_json_fallback():
        for v in _json("vehicles", "vehicles.json"):
            reg = (v.get("registration_number") or "").upper()
            vin = (v.get("vin") or "").upper()
            if q in reg or q in vin:
                cust = get_customer(v.get("customer_id", "")) or {}
                return {"found": True, **_map_vehicle(v),
                        "customer_id":    cust.get("id"),
                        "customer_name":  cust.get("name"),
                        "customer_phone": cust.get("phone"),
                        "customer_email": cust.get("email")}
    return {"found": False}

def add_vehicle(customer_id: str, data: dict) -> dict:
    vid = f"V{len(_json('vehicles','vehicles.json'))+1:03d}" if _use_json_fallback() else _new_id()
    v = {"id": vid, "customer_id": customer_id, "make": data["make"],
         "model": data["model"], "year": data["year"],
         "fuel_type": data.get("fuel_type"), "transmission": data.get("transmission"),
         "registration_number": data.get("registration_number"), "vin": data.get("vin")}
    if _db_available():
        ok = _sql_exec(
            "INSERT INTO Vehicles (id, customer_id, make, model, year, fuel_type, transmission, registration_number, vin) "
            "VALUES (?,?,?,?,?,?,?,?,?)",
            (vid, customer_id, v["make"], v["model"], v["year"],
             v["fuel_type"], v["transmission"], v["registration_number"], v["vin"])
        )
        if ok:
            return v
    if _use_json_fallback():
        _json("vehicles", "vehicles.json").append(v)
    return v

def update_vehicle(vehicle_id: str, data: dict) -> Optional[dict]:
    if _db_available():
        cols = ["make", "model", "year", "vin", "fuel_type", "transmission", "registration_number"]
        sets, params = [], []
        for col in cols:
            if col in data and data[col] is not None:
                sets.append(f"{col} = ?"); params.append(data[col])
        if sets:
            params.append(vehicle_id)
            _sql_exec(f"UPDATE Vehicles SET {', '.join(sets)} WHERE id = ?", tuple(params))
    return None

def get_customer_history(customer_id: str) -> list[dict]:
    if _db_available():
        rows = _sql_rows("SELECT * FROM Job_Cards WHERE customer_id = ? ORDER BY created_at DESC", (customer_id,))
        return [_map_job(r) for r in rows]
    if _use_json_fallback():
        cust = get_customer(customer_id)
        if not cust:
            return []
        name = cust.get("name", "")
        return [j for j in _json("job_cards", "job_cards.json") if j.get("customerName") == name]
    return []

# ─── Dashboard ────────────────────────────────────────────────────────────────

def get_advisor_dashboard(advisor_id: Optional[str] = None) -> dict:
    jobs = list_job_cards(advisor_id=advisor_id)
    today = datetime.now(timezone.utc).date().isoformat()
    return {
        "open_jobs":        sum(1 for j in jobs if j.get("status") not in ("completed", "closed")),
        "pending_approval": sum(1 for j in jobs if j.get("status") == "pending_approval"),
        "in_progress":      sum(1 for j in jobs if j.get("status") == "in_progress"),
        "completed_today":  sum(1 for j in jobs if j.get("status") == "completed"
                               and j.get("createdAt", "").startswith(today)),
        "recent_jobs": jobs[:10],
    }

def get_manager_dashboard() -> dict:
    jobs = list_job_cards()
    today = datetime.now(timezone.utc).date().isoformat()
    risky = {"high", "high engine temperature", "high brake risk"}

    def risk_level(j: dict) -> str:
        indicators = [r.lower() for r in (j.get("riskIndicators") or [])]
        if any(r in risky for r in indicators): return "high"
        if any("medium" in r for r in indicators): return "medium"
        return "low"

    jobs_with_eta = [{**j, "eta": "2026-03-01", "riskLevel": risk_level(j)} for j in jobs]
    return {
        "in_progress":      sum(1 for j in jobs if j.get("status") == "in_progress"),
        "at_risk":          sum(1 for j in jobs if risk_level(j) == "high"),
        "pending_approval": sum(1 for j in jobs if j.get("status") == "pending_approval"),
        "completed_today":  sum(1 for j in jobs if j.get("status") == "completed"
                               and j.get("createdAt", "").startswith(today)),
        "jobs_with_eta": jobs_with_eta[:20],
    }

# ─── Auth helpers ─────────────────────────────────────────────────────────────

def find_employee(username: str) -> Optional[dict]:
    if _db_available():
        rows = _sql_rows("SELECT * FROM Employee WHERE username = ? OR email = ?", (username, username))
        return rows[0] if rows else None
    if _use_json_fallback():
        return next((e for e in _json("emp", "employee.json")
                     if e.get("username") == username or e.get("email") == username), None)
    return None

def find_customer_by_email(email: str) -> Optional[dict]:
    if _db_available():
        rows = _sql_rows("SELECT * FROM Customers WHERE email = ?", (email,))
        return _map_customer(rows[0]) if rows else None
    if _use_json_fallback():
        return next((c for c in _json("customers", "customers.json") if c.get("email") == email), None)
    return None
