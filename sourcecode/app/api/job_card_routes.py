"""Job Card CRUD routes."""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from typing import Optional

from app.domain.schemas import JobCardCreate, JobCardUpdate, JobCardStatusUpdate, JobCardResponse
from app.application import db_service as db

router = APIRouter(prefix="/job-cards", tags=["Job Cards"])

def _map(jc: dict) -> dict:
    """Normalise JSON fixture keys to snake_case for response."""
    return {
        "id": jc.get("id"),
        "created_at": jc.get("createdAt", ""),
        "status": jc.get("status", "draft"),
        "customer_id": jc.get("customerId"),
        "customer_name": jc.get("customerName"),
        "vehicle_id": jc.get("vehicleId"),
        "vehicle_make": jc.get("vehicleMake"),
        "vehicle_model": jc.get("vehicleModel"),
        "vehicle_year": jc.get("vehicleYear"),
        "vin": jc.get("vin"),
        "mileage": jc.get("mileage"),
        "complaint": jc.get("complaint"),
        "service_type": jc.get("serviceType"),
        "risk_indicators": jc.get("riskIndicators", []),
        "obd_fault_codes": jc.get("obdFaultCodes", []),
        "obd_document_id": jc.get("obdDocumentId"),
        "obd_report_text": jc.get("obdReportText"),
        "obd_report_summary": jc.get("obdReportSummary"),
        "advisor_id": jc.get("advisorId"),
    }

@router.get("", response_model=list[dict])
def list_job_cards(status: Optional[str] = None, advisor_id: Optional[str] = None):
    return [_map(j) for j in db.list_job_cards(status=status, advisor_id=advisor_id)]

@router.get("/{job_id}", response_model=dict)
def get_job_card(job_id: str):
    jc = db.get_job_card(job_id)
    if not jc:
        raise HTTPException(status_code=404, detail=f"Job card {job_id} not found")
    return _map(jc)

@router.post("", response_model=dict)
def create_job_card(payload: JobCardCreate):
    jc = db.create_job_card(payload.model_dump())
    return _map(jc)

@router.put("/{job_id}", response_model=dict)
def update_job_card(job_id: str, payload: JobCardUpdate):
    jc = db.update_job_card(job_id, payload.model_dump(exclude_none=True))
    if not jc:
        raise HTTPException(status_code=404, detail=f"Job card {job_id} not found")
    return _map(jc)

@router.post("/{job_id}/status", response_model=dict)
def update_status(job_id: str, payload: JobCardStatusUpdate):
    jc = db.update_job_card_status(job_id, payload.status)
    if not jc:
        raise HTTPException(status_code=404, detail=f"Job card {job_id} not found")
    return _map(jc)

@router.delete("/{job_id}")
def delete_job_card(job_id: str):
    ok = db.delete_job_card(job_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Job card {job_id} not found")
    return {"status": "closed"}
