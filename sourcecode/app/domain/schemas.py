from pydantic import BaseModel

class IntakeResponse(BaseModel):
    job_id: str
    complaint_text: str
    blob_url: str
    status: str