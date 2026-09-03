"""
Pydantic schemas — POST /api/v1/analyze
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class TopPrediction(BaseModel):
    disease: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class DiagnosisDetail(BaseModel):
    disease: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    uncertain: bool
    """True when confidence < inference_confidence_threshold."""
    top_predictions: list[TopPrediction]
    is_mock: bool


class SeverityDetail(BaseModel):
    affected_percentage: float = Field(..., ge=0.0, le=100.0)
    tier: str
    """healthy | low | moderate | severe"""


class ExplanationDetail(BaseModel):
    gradcam_image: str | None = None
    """
    Base64-encoded JPEG overlay image (data:image/jpeg;base64,...).
    Null when model is unavailable or mock mode is active.
    """


class AnalyzeResponse(BaseModel):
    success: bool = True
    diagnosis_id: str | None = None
    diagnosis: DiagnosisDetail
    severity: SeverityDetail
    explanation: ExplanationDetail
    escalate: bool
    """True when confidence < expert_confidence_threshold."""
    is_mock: bool
    """True when any part of the pipeline used mock/stub data."""
