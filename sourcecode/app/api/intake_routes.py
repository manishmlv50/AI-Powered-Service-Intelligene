import uuid
from fastapi import APIRouter, UploadFile, File, Form
from app.infrastructure.blob_storage import BlobStorageService
# from app.infrastructure.cosmos_repository import CosmosRepository
from app.domain.schemas import IntakeResponse
from app.domain.job_status import JobStatus

router = APIRouter()

blob_service = BlobStorageService()
# cosmos_repo = CosmosRepository()

@router.post("/intake/start", response_model=IntakeResponse)
async def start_intake(
    complaint_text: str = Form(...),
    file: UploadFile = File(...)
):
    job_id = str(uuid.uuid4())

    file_bytes = await file.read()

    blob_url = blob_service.upload_file(
        file_bytes=file_bytes,
        filename=file.filename,
        job_id=job_id
    )

    intake_record = {
        "id": job_id,                 # Cosmos requires id field
        "job_id": job_id,
        "complaint_text": complaint_text,
        "blob_url": blob_url,
        "status": JobStatus.INTAKE_RECEIVED
    }

    # cosmos_repo.create_intake_record(intake_record)

    return IntakeResponse(
        job_id=job_id,
        complaint_text=complaint_text,
        blob_url=blob_url,
        status=JobStatus.INTAKE_RECEIVED
    )