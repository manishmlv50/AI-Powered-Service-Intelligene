"""Dashboard KPI aggregation routes."""
from __future__ import annotations
from fastapi import APIRouter
from typing import Optional
from app.application import db_service as db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/advisor", response_model=dict)
def advisor_dashboard(advisor_id: Optional[str] = None):
    data = db.get_advisor_dashboard(advisor_id=advisor_id)
    # Normalise recent_jobs keys
    data["recent_jobs"] = [
        {
            "id": j.get("id"),
            "created_at": j.get("createdAt", ""),
            "status": j.get("status"),
            "customer_name": j.get("customerName"),
            "vehicle_make": j.get("vehicleMake"),
            "vehicle_model": j.get("vehicleModel"),
            "vehicle_year": j.get("vehicleYear"),
            "complaint": j.get("complaint"),
            "service_type": j.get("serviceType"),
            "advisor_id": j.get("advisorId"),
        }
        for j in data["recent_jobs"]
    ]
    return data

@router.get("/manager", response_model=dict)
def manager_dashboard():
    data = db.get_manager_dashboard()
    data["jobs_with_eta"] = [
        {
            "id": j.get("id"),
            "created_at": j.get("createdAt", ""),
            "status": j.get("status"),
            "customer_name": j.get("customerName"),
            "vehicle_make": j.get("vehicleMake"),
            "vehicle_model": j.get("vehicleModel"),
            "vehicle_year": j.get("vehicleYear"),
            "complaint": j.get("complaint"),
            "service_type": j.get("serviceType"),
            "eta": j.get("eta"),
            "risk_level": j.get("riskLevel", "low"),
        }
        for j in data["jobs_with_eta"]
    ]
    return data
