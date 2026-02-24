"""Domain enum for job lifecycle status."""

class JobStatus:
    DRAFT             = "draft"
    PENDING_APPROVAL  = "pending_approval"
    IN_PROGRESS       = "in_progress"
    COMPLETED         = "completed"
    CLOSED            = "closed"

    ALL = [DRAFT, PENDING_APPROVAL, IN_PROGRESS, COMPLETED, CLOSED]

    # Legacy names (kept for backward compat)
    INTAKE_RECEIVED = "INTAKE_RECEIVED"
    FILE_UPLOADED   = "FILE_UPLOADED"
    PROCESSING      = "PROCESSING"

class EstimateStatus:
    PENDING_APPROVAL = "pending_approval"
    APPROVED         = "approved"
    REJECTED         = "rejected"
    REVISED          = "revised"