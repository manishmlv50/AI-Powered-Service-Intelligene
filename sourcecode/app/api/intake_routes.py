import uuid
from fastapi import APIRouter, UploadFile, File, Form
from app.infrastructure.blob_storage import BlobStorageService
from app.domain.schemas import IntakeResponse

router = APIRouter()
blob_service = BlobStorageService()

@router.get("/intake/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@router.post("/intake/start", response_model=IntakeResponse)
async def start_intake(
    complaint_text: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Intake Step 1:
    - Receive complaint text
    - Upload OBD PDF to Blob Storage
    """

    # 🔹 Generate Job ID (workflow key)
    job_id = str(uuid.uuid4())

    # 🔹 Read uploaded file
    file_bytes = await file.read()

    # 🔹 Upload to Azure Blob
    blob_url = blob_service.upload_file(
        file_bytes=file_bytes,
        filename=file.filename,
        job_id=job_id
    )

    return IntakeResponse(
        job_id=job_id,
        complaint_text=complaint_text,
        blob_url=blob_url,
        status="FILE_UPLOADED"
    )