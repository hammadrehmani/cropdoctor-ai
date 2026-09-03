"""API route — Disease Diagnosis & History endpoints."""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Query, UploadFile
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.diagnosis import Diagnosis
from app.schemas.diagnosis import (
    CropType,
    DiagnosisHistoryItem,
    DiagnosisHistoryListResponse,
    DiagnosisResponse,
    RiskLevel,
)
from app.services.expert.router import should_escalate_diagnosis
from app.services.geo.privacy import coords_to_district
from app.services.vision.classifier import classifier
from app.services.vision.severity import estimate_severity

logger = logging.getLogger(__name__)

router = APIRouter(tags=["diagnosis"])


def _severity_to_risk(severity_pct: float, confidence: float) -> RiskLevel:
    """Convert severity percentage and confidence to a risk level."""
    if severity_pct >= 60 or confidence > 0.85:
        return RiskLevel.critical
    if severity_pct >= 35:
        return RiskLevel.high
    if severity_pct >= 15:
        return RiskLevel.medium
    return RiskLevel.low


@router.post(
    "/diagnose",
    response_model=DiagnosisResponse,
    summary="Diagnose crop disease from leaf image (Phase 1 endpoint)",
)
async def diagnose(
    image: UploadFile = File(..., description="Leaf image (JPEG or PNG, max 10 MB)"),
    crop: CropType = Form(..., description="Crop type"),
    lat: float | None = Form(None, description="Farmer GPS latitude (immediately anonymised)"),
    lon: float | None = Form(None, description="Farmer GPS longitude (immediately anonymised)"),
    device_id: str | None = Form(None, description="Anonymous device identifier"),
    x_device_id: str | None = Header(
        None, alias="X-Device-Id", description="Anonymous device ID header"
    ),
    db: AsyncSession = Depends(get_db),
) -> DiagnosisResponse:
    """
    Phase 1 compatible diagnosis endpoint.
    For the full structured response with Grad-CAM base64 see POST /api/v1/analyze.
    """
    effective_device_id = device_id or x_device_id

    # Validate file size
    contents = await image.read()
    if len(contents) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Image too large. Maximum size is {settings.max_upload_size_mb} MB.",
        )

    # Validate content type
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Please upload a JPEG or PNG image.",
        )

    # 1. Disease classification
    diag_dict = await classifier.predict(contents, crop=crop.value)
    disease: str = diag_dict["disease"]
    confidence: float = diag_dict["confidence"]
    uncertain: bool = diag_dict.get("uncertain", False)
    is_mock: bool = diag_dict.get("is_mock", False)

    # 2. Severity estimation — returns SeverityResult dataclass
    sev_result = await estimate_severity(
        contents,
        threshold_low=settings.severity_threshold_low,
        threshold_moderate=settings.severity_threshold_moderate,
        threshold_severe=settings.severity_threshold_severe,
    )
    severity_pct = sev_result.affected_percentage

    # 3. Grad-CAM — only when real model is loaded
    gradcam_url: str | None = None
    if not settings.diagnosis_mock_mode and classifier.raw_model is not None:
        from app.services.vision.gradcam import GradCAMService
        gradcam_url = GradCAMService.generate_overlay(
            image_bytes=contents,
            model=classifier.raw_model,
        )

    # 4. GPS Privacy — immediately anonymise to district
    district: str | None = None
    if lat is not None and lon is not None:
        district_info = coords_to_district(lat, lon)
        district = district_info["name"] if district_info else None

    # 5. Risk level
    risk_level = _severity_to_risk(severity_pct, confidence)

    # 6. Expert escalation
    escalate = should_escalate_diagnosis(confidence)

    diag_id = str(uuid.uuid4())

    # 7. Persist record to database
    try:
        diag_record = Diagnosis(
            id=diag_id,
            crop=crop.value,
            disease=disease,
            confidence=confidence,
            severity_pct=severity_pct,
            risk_level=sev_result.severity_tier,
            district=district,
            device_id=effective_device_id,
            escalated=escalate,
            uncertain=uncertain,
            is_mock=is_mock,
        )
        db.add(diag_record)
        await db.commit()
    except Exception as exc:
        logger.warning(f"Failed to persist diagnose record: {exc}")
        await db.rollback()

    return DiagnosisResponse(
        diagnosis_id=diag_id,
        crop=crop,
        disease=disease,
        confidence=round(confidence, 3),
        severity_pct=severity_pct,
        risk_level=risk_level,
        gradcam_url=gradcam_url,
        district=district,
        escalate=escalate,
        is_mock=is_mock,
    )


@router.get(
    "/diagnoses",
    response_model=DiagnosisHistoryListResponse,
    summary="Get paginated diagnosis history (newest first, device-isolated)",
)
async def list_diagnoses(
    device_id: str | None = Query(None, description="Filter history by anonymous device ID"),
    x_device_id: str | None = Header(
        None, alias="X-Device-Id", description="Anonymous device ID header"
    ),
    limit: int = Query(20, ge=1, le=100, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: AsyncSession = Depends(get_db),
) -> DiagnosisHistoryListResponse:
    """
    Returns recent diagnosis history sorted newest first.
    Strict privacy: only district-level location is stored/returned, never raw GPS.
    Device isolation: when device_id is provided, returns only history for that device.
    """
    effective_device_id = device_id or x_device_id

    total_query = select(func.count(Diagnosis.id))
    query = select(Diagnosis).order_by(desc(Diagnosis.created_at))

    if effective_device_id:
        total_query = total_query.where(Diagnosis.device_id == effective_device_id)
        query = query.where(Diagnosis.device_id == effective_device_id)

    total_result = await db.execute(total_query)
    total_count = total_result.scalar_one()

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    diagnoses = result.scalars().all()

    items = [
        DiagnosisHistoryItem(
            id=d.id,
            crop=d.crop,
            disease=d.disease,
            confidence=d.confidence,
            uncertain=d.uncertain,
            severity_pct=d.severity_pct,
            severity_tier=d.risk_level,
            district=d.district,
            device_id=d.device_id,
            escalated=d.escalated,
            is_mock=d.is_mock,
            created_at=d.created_at,
        )
        for d in diagnoses
    ]

    return DiagnosisHistoryListResponse(
        items=items,
        total=total_count,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/diagnoses/{diagnosis_id}",
    response_model=DiagnosisHistoryItem,
    summary="Get single diagnosis history record",
)
async def get_diagnosis_by_id(
    diagnosis_id: str,
    db: AsyncSession = Depends(get_db),
) -> DiagnosisHistoryItem:
    """Fetch an individual diagnosis record by ID."""
    query = select(Diagnosis).where(Diagnosis.id == diagnosis_id)
    result = await db.execute(query)
    diag = result.scalar_one_or_none()

    if diag is None:
        raise HTTPException(
            status_code=404,
            detail=f"Diagnosis with ID '{diagnosis_id}' not found.",
        )

    return DiagnosisHistoryItem(
        id=diag.id,
        crop=diag.crop,
        disease=diag.disease,
        confidence=diag.confidence,
        uncertain=diag.uncertain,
        severity_pct=diag.severity_pct,
        severity_tier=diag.risk_level,
        district=diag.district,
        device_id=diag.device_id,
        escalated=diag.escalated,
        is_mock=diag.is_mock,
        created_at=diag.created_at,
    )
