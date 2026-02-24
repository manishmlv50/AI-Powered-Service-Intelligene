"""Pydantic schemas for all request/response models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, List


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    role: str          # advisor | manager | customer
    user_id: str
    name: str


# ─── Vehicle ─────────────────────────────────────────────────────────────────

class VehicleCreate(BaseModel):
    make: str
    model: str
    year: int
    vin: Optional[str] = None
    mileage: Optional[int] = None

class VehicleResponse(BaseModel):
    id: str
    customer_id: str
    make: str
    model: str
    year: int
    vin: Optional[str] = None
    mileage: Optional[int] = None


# ─── Customer ─────────────────────────────────────────────────────────────────

class CustomerResponse(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    preferred_contact: Optional[str] = None
    vehicles: Optional[List[VehicleResponse]] = None


# ─── Job Card ─────────────────────────────────────────────────────────────────

class JobCardCreate(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[int] = None
    vin: Optional[str] = None
    mileage: Optional[int] = None
    complaint: Optional[str] = None
    service_type: Optional[str] = None
    risk_indicators: Optional[List[str]] = None
    obd_fault_codes: Optional[List[str]] = None
    obd_document_id: Optional[str] = None
    advisor_id: Optional[str] = None
    obd_report_text: Optional[str] = None
    obd_report_summary: Optional[str] = None

class JobCardUpdate(BaseModel):
    customer_name: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[int] = None
    vin: Optional[str] = None
    mileage: Optional[int] = None
    complaint: Optional[str] = None
    service_type: Optional[str] = None
    risk_indicators: Optional[List[str]] = None
    obd_fault_codes: Optional[List[str]] = None
    status: Optional[str] = None
    obd_report_text: Optional[str] = None
    obd_report_summary: Optional[str] = None

class JobCardStatusUpdate(BaseModel):
    status: str

class JobCardResponse(BaseModel):
    id: str
    created_at: str
    status: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[int] = None
    vin: Optional[str] = None
    mileage: Optional[int] = None
    complaint: Optional[str] = None
    service_type: Optional[str] = None
    risk_indicators: Optional[List[str]] = None
    obd_fault_codes: Optional[List[str]] = None
    obd_document_id: Optional[str] = None
    advisor_id: Optional[str] = None
    obd_report_text: Optional[str] = None
    obd_report_summary: Optional[str] = None

# ─── Estimate ─────────────────────────────────────────────────────────────────

class EstimateLineItemResponse(BaseModel):
    id: str
    description: str
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    hours: Optional[float] = None
    rate_per_hour: Optional[float] = None
    total: Optional[float] = None
    type: Optional[str] = "part"   # part | labor

class EstimateResponse(BaseModel):
    id: str
    job_card_id: str
    created_at: str
    status: str              # pending_approval | approved | rejected | revised
    parts_total: Optional[float] = None
    labor_total: Optional[float] = None
    tax: Optional[float] = None
    subtotal: Optional[float] = None
    total_amount: Optional[float] = None
    line_items: Optional[List[EstimateLineItemResponse]] = None

class EstimateStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardAdvisorResponse(BaseModel):
    open_jobs: int
    pending_approval: int
    in_progress: int
    completed_today: int
    recent_jobs: List[JobCardResponse]

class DashboardManagerResponse(BaseModel):
    in_progress: int
    at_risk: int
    pending_approval: int
    completed_today: int
    jobs_with_eta: List[dict]


# ─── Agent / AI ──────────────────────────────────────────────────────────────

class MasterAgentRequest(BaseModel):
    action: Optional[str] = None          # intake | estimate | send_approval | customer_qa | chat
    user_input: Optional[str] = None
    vehicle_id: Optional[str] = None
    customer_complaint: Optional[str] = None
    obd_report_text: Optional[str] = None
    job_card_id: Optional[str] = None
    question: Optional[str] = None
    context: Optional[dict] = None

class AgentIntakeResponse(BaseModel):
    agent: str
    vehicle_id: str
    customer_complaint: str
    obd_report_summary: str
    job_details: str

class MasterAgentResult(BaseModel):
    intake: Optional[AgentIntakeResponse] = None
    estimate: Optional[dict] = None
    communication: Optional[dict] = None
    eta: Optional[dict] = None
    reply: Optional[str] = None

class MasterAgentResponse(BaseModel):
    workflow: str
    result: MasterAgentResult


# ─── Legacy (kept for compatibility) ─────────────────────────────────────────

class IntakeResponse(BaseModel):
    job_id: str
    complaint_text: str
    blob_url: str
    status: str

class SqlVehicleDetails(BaseModel):
    vehicle_id: str
    customer_id: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    vin: Optional[str] = None

class SqlUserDetails(BaseModel):
    customer_id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    preferred_contact: Optional[str] = None

class SqlPartDetails(BaseModel):
    part_id: str
    part_code: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[float] = None
    category: Optional[str] = None

class SqlLookupResult(BaseModel):
    vehicle: Optional[SqlVehicleDetails] = None
    customer: Optional[SqlUserDetails] = None
    parts: Optional[List[SqlPartDetails]] = None