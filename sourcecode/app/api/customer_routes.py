"""Customer, vehicle, and service history routes — v2 schema."""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from typing import Optional
from app.domain.schemas import VehicleCreate
from app.application import db_service as db

router = APIRouter(prefix="/customers", tags=["Customers"])


def _map_vehicle(v: dict) -> dict:
    return {
        "id":                  v.get("id"),
        "customer_id":         v.get("customerId") or v.get("customer_id"),
        "make":                v.get("make"),
        "model":               v.get("model"),
        "year":                v.get("year"),
        "vin":                 v.get("vin"),
        "fuel_type":           v.get("fuel_type"),
        "transmission":        v.get("transmission"),
        "registration_number": v.get("registration_number"),
    }


def _map_jc(jc: dict) -> dict:
    return {
        "id":            jc.get("id"),
        "created_at":    jc.get("createdAt", ""),
        "status":        jc.get("status"),
        "customer_id":   jc.get("customerId") or jc.get("customer_id"),
        "vehicle_id":    jc.get("vehicleId") or jc.get("vehicle_id"),
        "customer_name": jc.get("customerName") or jc.get("customer_name"),
        "vehicle_make":  jc.get("vehicleMake")  or jc.get("vehicle_make"),
        "vehicle_model": jc.get("vehicleModel") or jc.get("vehicle_model"),
        "vehicle_year":  jc.get("vehicleYear")  or jc.get("vehicle_year"),
        "complaint":     jc.get("complaint"),
        "service_type":  jc.get("serviceType")  or jc.get("service_type"),
    }


def _map_jc_detail(jc: dict) -> dict:
    return {
        "id": jc.get("id"),
        "created_at": jc.get("createdAt", ""),
        "status": jc.get("status", "draft"),
        "customer_id": jc.get("customerId") or jc.get("customer_id"),
        "customer_name": jc.get("customerName") or jc.get("customer_name"),
        "vehicle_id": jc.get("vehicleId") or jc.get("vehicle_id"),
        "vehicle_make": jc.get("vehicleMake") or jc.get("vehicle_make"),
        "vehicle_model": jc.get("vehicleModel") or jc.get("vehicle_model"),
        "vehicle_year": jc.get("vehicleYear") or jc.get("vehicle_year"),
        "vin": jc.get("vin"),
        "mileage": jc.get("mileage"),
        "complaint": jc.get("complaint"),
        "service_type": jc.get("serviceType") or jc.get("service_type"),
        "risk_indicators": jc.get("riskIndicators") or jc.get("risk_indicators") or [],
        "obd_fault_codes": jc.get("obdFaultCodes") or jc.get("obd_fault_codes") or [],
        "tasks": jc.get("tasks") or [],
    }


def _map_estimate(est: dict) -> dict:
    estimation_json = est.get("estimation_json")
    return {
        "id": est.get("id"),
        "job_card_id": est.get("job_card_id"),
        "created_at": est.get("createdAt", ""),
        "status": est.get("status", "pending_approval"),
        "parts_total": est.get("parts_total", 0),
        "labor_total": est.get("labor_total", 0),
        "tax": est.get("tax", 0),
        "total_amount": est.get("grand_total", 0),
        "line_items": est.get("lineItems", []),
        "estimation_json": estimation_json,
        "estimate": estimation_json if isinstance(estimation_json, dict) else None,
    }


# ── Customer endpoints ────────────────────────────────────────────────────────

@router.get("", response_model=list[dict])
def list_customers():
    return db.list_customers()


@router.get("/{customer_id}", response_model=dict)
def get_customer(customer_id: str):
    c = db.get_customer(customer_id)
    if not c:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")
    vehicles = [_map_vehicle(v) for v in db.get_customer_vehicles(customer_id)]
    return {**c, "vehicles": vehicles}


# ── Vehicle search (must come before /{customer_id}/vehicles to avoid routing conflict) ──

@router.get("/vehicles/search", response_model=dict)
def search_vehicle_by_vin(vin: str = ""):
    """Search for a vehicle and its owner by VIN or registration number (partial match).
    Returns vehicle_id, vehicle details, and customer info for pre-filling the intake form."""
    if not vin or len(vin.strip()) < 3:
        raise HTTPException(
            status_code=400,
            detail="Provide at least 3 characters of VIN or registration number"
        )
    result = db.search_vehicle_by_number(vin)
    if not result or not result.get("found"):
        return {"found": False}
    return {
        "found":               True,
        "vehicle_id":          result.get("id"),
        "vehicle_vin":         result.get("vin"),
        "vehicle_make":        result.get("make"),
        "vehicle_model":       result.get("model"),
        "vehicle_year":        result.get("year"),
        "fuel_type":           result.get("fuel_type"),
        "transmission":        result.get("transmission"),
        "registration_number": result.get("registration_number"),
        "customer_id":         result.get("customer_id"),
        "customer_name":       result.get("customer_name"),
        "customer_phone":      result.get("customer_phone"),
        "customer_email":      result.get("customer_email"),
    }


# ── Per-customer vehicle endpoints ────────────────────────────────────────────

@router.get("/{customer_id}/vehicles", response_model=list[dict])
def get_vehicles(customer_id: str):
    return [_map_vehicle(v) for v in db.get_customer_vehicles(customer_id)]


@router.post("/{customer_id}/vehicles", response_model=dict)
def add_vehicle(customer_id: str, payload: VehicleCreate):
    v = db.add_vehicle(customer_id, payload.model_dump())
    return _map_vehicle(v)


@router.put("/{customer_id}/vehicles/{vehicle_id}", response_model=dict)
def update_vehicle(customer_id: str, vehicle_id: str, payload: dict):
    v = db.update_vehicle(vehicle_id, payload)
    if not v:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")
    return _map_vehicle(v)


@router.get("/{customer_id}/history", response_model=list[dict])
def get_history(customer_id: str):
    return [_map_jc(j) for j in db.get_customer_history(customer_id)]


@router.get("/{customer_id}/latest-job", response_model=dict)
def get_latest_job(customer_id: str):
    job = db.get_latest_job_card(customer_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"No jobs found for customer {customer_id}")
    return _map_jc(job)


@router.get("/{customer_id}/jobs", response_model=list[dict])
def get_customer_jobs(customer_id: str, status: Optional[str] = None):
    rows = db.list_job_cards(status=status, customer_id=customer_id)
    return [_map_jc(j) for j in rows]


@router.get("/{customer_id}/jobs/{job_id}", response_model=dict)
def get_customer_job_detail(customer_id: str, job_id: str):
    jc = db.get_job_card_for_customer(job_id, customer_id)
    if not jc:
        raise HTTPException(status_code=404, detail=f"Job card {job_id} not found")
    return _map_jc_detail(jc)


@router.get("/{customer_id}/jobs/{job_id}/estimate", response_model=dict)
def get_customer_job_estimate(customer_id: str, job_id: str):
    est = db.get_estimate_by_job_for_customer(job_id, customer_id)
    if not est:
        raise HTTPException(status_code=404, detail=f"No estimate for job {job_id}")
    return _map_estimate(est)
