"""Pydantic schemas — Diagnosis endpoint & History."""
from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class CropType(str, Enum):
    cotton = "cotton"
    wheat = "wheat"
    rice = "rice"
    sugarcane = "sugarcane"


class RiskLevel(str, Enum):
    low = "LOW"
    medium = "MEDIUM"
    high = "HIGH"
    critical = "CRITICAL"


class DiagnosisResponse(BaseModel):
    """Returned after a successful leaf image diagnosis."""

    diagnosis_id: str = Field(..., description="Unique record ID")
    crop: CropType
    disease: str = Field(..., description="Predicted disease name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence 0–1")
    severity_pct: float = Field(..., ge=0.0, le=100.0, description="Leaf area affected %")
    risk_level: RiskLevel
    gradcam_url: str | None = Field(None, description="URL to Grad-CAM overlay image")
    district: str | None = Field(None, description="Anonymised district name")
    escalate: bool = Field(..., description="True if confidence < threshold → route to expert")
    is_mock: bool = Field(False, description="True when MOCK_ML_MODELS=true")

    model_config = {"from_attributes": True}


class DiagnosisHistoryItem(BaseModel):
    """Individual diagnosis history item for farmer dashboard."""

    id: str = Field(..., description="Unique diagnosis ID")
    crop: str = Field(..., description="Crop name")
    disease: str = Field(..., description="Diagnosed disease")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence")
    uncertain: bool = Field(False, description="Whether prediction was flagged uncertain")
    severity_pct: float = Field(..., ge=0.0, le=100.0, description="Affected leaf area percentage")
    severity_tier: str = Field(..., description="Severity tier: healthy|low|moderate|severe")
    district: str | None = Field(None, description="Sanitized district only; no GPS")
    device_id: str | None = Field(None, description="Anonymous device identifier")
    escalated: bool = Field(False, description="Whether escalated to human expert")
    is_mock: bool = Field(False, description="Whether generated in demo/mock mode")
    created_at: datetime = Field(..., description="Timestamp of diagnosis")

    model_config = {"from_attributes": True}


class DiagnosisHistoryListResponse(BaseModel):
    """Paginated list of diagnosis history records."""

    items: list[DiagnosisHistoryItem]
    total: int
    limit: int
    offset: int
