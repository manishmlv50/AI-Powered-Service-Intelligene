from pydantic import BaseModel

class IntakeResponse(BaseModel):
    job_id: str
    complaint_text: str
    blob_url: str
    status: str


class AgentIntakeResponse(BaseModel):
    agent: str
    vehicle_id: str
    customer_complaint: str
    obd_report_summary: str
    job_details: str


class SqlVehicleDetails(BaseModel):
    vehicle_id: str
    customer_id: str | None = None
    make: str | None = None
    model: str | None = None
    year: int | None = None
    vin: str | None = None


class SqlUserDetails(BaseModel):
    customer_id: str
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    preferred_contact: str | None = None


class SqlPartDetails(BaseModel):
    part_id: str
    part_code: str | None = None
    description: str | None = None
    unit_price: float | None = None
    category: str | None = None


class SqlLookupResult(BaseModel):
    vehicle: SqlVehicleDetails | None = None
    customer: SqlUserDetails | None = None
    parts: list[SqlPartDetails] | None = None


class MasterAgentRequest(BaseModel):
    user_input: str | None = None
    vehicle_id: str | None = None
    customer_complaint: str | None = None
    obd_report_text: str | None = None


class MasterAgentResult(BaseModel):
    intake: AgentIntakeResponse | None = None
    estimate: dict | None = None
    communication: dict | None = None
    eta: dict | None = None


class MasterAgentResponse(BaseModel):
    workflow: str
    result: MasterAgentResult