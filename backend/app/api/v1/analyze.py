"""
API Route — POST /api/v1/analyze
==================================
Full ML diagnosis pipeline:
  image → validation → classifier → severity → Grad-CAM → persistence → response

Error handling:
  400 — corrupt/unreadable image
  413 — file too large
  415 — unsupported content type
  503 — model not loaded and DIAGNOSIS_MOCK_MODE=false
"""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.diagnosis import Diagnosis
from app.schemas.analyze import (
    AnalyzeResponse,
    DiagnosisDetail,
    ExplanationDetail,
    SeverityDetail,
    TopPrediction,
)
from app.services.expert.router import should_escalate_diagnosis
from app.services.vision.classifier import classifier
from app.services.vision.gradcam import GradCAMService
from app.services.vision.severity import estimate_severity

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["analyze"])

_ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


@router.post(
    "",
    response_model=AnalyzeResponse,
    summary="Full ML diagnosis: classifier + severity + Grad-CAM",
    responses={
        400: {"description": "Corrupt or unreadable image"},
        413: {"description": "File too large"},
        415: {"description": "Unsupported file type"},
        503: {"description": "Model not loaded (set DIAGNOSIS_MOCK_MODE=true for demo)"},
    },
)
async def analyze(
    image: UploadFile = File(..., description="Leaf image JPEG/PNG/WebP, max 10 MB"),
    crop: str | None = Form(None, description="Crop hint (cotton|wheat|rice|sugarcane)"),
    district: str | None = Form(None, description="District name (informational only)"),
    language: str | None = Form("en", description="Language code (en|ur|sd)"),
    device_id: str | None = Form(None, description="Anonymous device identifier"),
    x_device_id: str | None = Header(
        None, alias="X-Device-Id", description="Anonymous device ID header"
    ),
    db: AsyncSession = Depends(get_db),
) -> AnalyzeResponse:
    """
    Run the complete diagnosis pipeline on a leaf image.

    Steps (in order):
    1. Validate file type and size
    2. Disease classification (EfficientNet-B0 or labelled mock)
    3. Severity estimation (OpenCV HSV — always real)
    4. Grad-CAM overlay (only when real model is loaded)
    5. Expert escalation flag
    6. Persist diagnosis record into database
    """
    # ── 1. File validation ────────────────────────────────────────────────────
    if image.content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type: '{image.content_type}'. "
                "Please upload a JPEG, PNG, or WebP image."
            ),
        )

    image_bytes = await image.read()

    if len(image_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File too large ({len(image_bytes) // 1024} KB). "
                f"Maximum allowed size is {settings.max_upload_size_mb} MB."
            ),
        )

    if len(image_bytes) < 8:
        raise HTTPException(
            status_code=400,
            detail="Image file is empty or too small to be valid.",
        )

    logger.info(
        f"/analyze: crop={crop}, district={district}, lang={language}, "
        f"size={len(image_bytes)} bytes, mock={settings.diagnosis_mock_mode}"
    )

    # ── 2. Disease classification ─────────────────────────────────────────────
    # classifier.predict() raises HTTPException(503) if not loaded in real mode
    # and HTTPException(400) if image is corrupt.
    diag_dict = await classifier.predict(image_bytes, crop=crop)

    diagnosis = DiagnosisDetail(
        disease=diag_dict["disease"],
        confidence=diag_dict["confidence"],
        uncertain=diag_dict["uncertain"],
        top_predictions=[TopPrediction(**p) for p in diag_dict["top_predictions"]],
        is_mock=diag_dict["is_mock"],
    )

    # ── 3. Severity estimation (always real — no model needed) ────────────────
    sev = await estimate_severity(
        image_bytes,
        threshold_low=settings.severity_threshold_low,
        threshold_moderate=settings.severity_threshold_moderate,
        threshold_severe=settings.severity_threshold_severe,
    )
    severity = SeverityDetail(
        affected_percentage=sev.affected_percentage,
        tier=sev.severity_tier,
    )

    # ── 4. Grad-CAM (only when real model is loaded) ──────────────────────────
    gradcam_b64: str | None = None
    if not settings.diagnosis_mock_mode and classifier.raw_model is not None:
        gradcam_b64 = GradCAMService.generate_overlay(
            image_bytes=image_bytes,
            model=classifier.raw_model,
            target_class=None,  # highest-scoring class
            image_size=224,
        )
    # In mock mode: gradcam_image stays None — never fabricated

    explanation = ExplanationDetail(gradcam_image=gradcam_b64)

    # ── 5. Expert escalation ──────────────────────────────────────────────────
    escalate = should_escalate_diagnosis(diagnosis.confidence)

    is_mock = diagnosis.is_mock  # propagate mock flag

    # ── 6. Persist diagnosis record ───────────────────────────────────────────
    effective_device_id = device_id or x_device_id
    diag_id = str(uuid.uuid4())
    try:
        diag_record = Diagnosis(
            id=diag_id,
            crop=crop or "wheat",
            disease=diagnosis.disease,
            confidence=diagnosis.confidence,
            severity_pct=severity.affected_percentage,
            risk_level=severity.tier,
            district=district,
            device_id=effective_device_id,
            escalated=escalate,
            uncertain=diagnosis.uncertain,
            is_mock=is_mock,
        )
        db.add(diag_record)
        await db.commit()
    except Exception as exc:
        logger.warning(f"Failed to persist diagnosis record: {exc}")
        await db.rollback()

    return AnalyzeResponse(
        success=True,
        diagnosis_id=diag_id,
        diagnosis=diagnosis,
        severity=severity,
        explanation=explanation,
        escalate=escalate,
        is_mock=is_mock,
    )
