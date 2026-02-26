"""Estimate routes — create, revise, approve, reject."""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from app.domain.schemas import EstimateStatusUpdate
from app.application import db_service as db

router = APIRouter(prefix="/estimates", tags=["Estimates"])

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

@router.get("/job/{job_card_id}", response_model=dict)
def get_estimate_for_job(job_card_id: str):
    est = db.get_estimate_by_job(job_card_id)
    if not est:
        raise HTTPException(status_code=404, detail=f"No estimate for job {job_card_id}")
    return _map_estimate(est)

@router.get("", response_model=list[dict])
def list_estimates():
    return [_map_estimate(e) for e in db.get_all_estimates_with_job()]

@router.get("/{estimate_id}", response_model=dict)
def get_estimate(estimate_id: str):
    est = db.get_estimate(estimate_id)
    if not est:
        raise HTTPException(status_code=404, detail=f"Estimate {estimate_id} not found")
    return _map_estimate(est)

@router.post("", response_model=dict)
def create_estimate(payload: dict):
    job_card_id = payload.get("job_card_id")
    if not job_card_id:
        raise HTTPException(status_code=400, detail="job_card_id is required")
    est = db.create_estimate(job_card_id, payload)
    return _map_estimate(est)

@router.post("/{estimate_id}/approve", response_model=dict)
def approve_estimate(estimate_id: str):
    est = db.update_estimate_status(estimate_id, "approved")
    if not est:
        raise HTTPException(status_code=404, detail=f"Estimate {estimate_id} not found")
    return _map_estimate(est)

@router.post("/{estimate_id}/reject", response_model=dict)
def reject_estimate(estimate_id: str, payload: EstimateStatusUpdate = EstimateStatusUpdate(status="rejected")):
    est = db.update_estimate_status(estimate_id, "rejected")
    if not est:
        raise HTTPException(status_code=404, detail=f"Estimate {estimate_id} not found")
    return _map_estimate(est)

@router.put("/{estimate_id}", response_model=dict)
def update_estimate(estimate_id: str, payload: dict):
    est = db.update_estimate_status(estimate_id, payload.get("status", "revised"))
    if not est:
        raise HTTPException(status_code=404, detail=f"Estimate {estimate_id} not found")
    return _map_estimate(est)
