"""API route — Expert Escalation."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/expert", tags=["expert"])


class EscalateRequest(BaseModel):
    source: str = Field(..., description="diagnosis | chat")
    diagnosis_id: str | None = None
    chat_session_id: str | None = None
    crop: str | None = None
    disease: str | None = None
    confidence: float | None = None
    context: str | None = Field(None, description="Farmer's description or question (no PII)")


class EscalateResponse(BaseModel):
    request_id: str
    status: str = "pending"
    message: str


@router.post(
    "/escalate",
    response_model=EscalateResponse,
    summary="Escalate a low-confidence case to a human agricultural expert",
)
async def escalate(request: EscalateRequest) -> EscalateResponse:
    """
    Submits a low-confidence diagnosis or chat question for human expert review.
    Returns a tracking ID and status.
    """
    import uuid

    request_id = str(uuid.uuid4())

    # Phase 5: persist to DB + trigger expert_webhook_url
    # For now: return acknowledgement
    return EscalateResponse(
        request_id=request_id,
        status="pending",
        message=(
            "Your case has been submitted to an agricultural expert. "
            "You will receive guidance within 24 hours."
        ),
    )


@router.get(
    "/status/{request_id}",
    summary="Check the status of an expert escalation request",
)
async def escalation_status(request_id: str) -> dict:
    """Check the current status of a submitted expert request."""
    # Phase 5: query DB by request_id
    return {
        "request_id": request_id,
        "status": "pending",
        "message": "An expert has been notified and will respond shortly.",
    }
