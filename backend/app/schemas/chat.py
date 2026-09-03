"""Pydantic schemas — Chat and Advisor endpoint (Phase 4)."""
from __future__ import annotations

from enum import Enum
from uuid import uuid4

from pydantic import BaseModel, Field


class Language(str, Enum):
    english = "en"
    urdu = "ur"
    sindhi = "sd"


class DiagnosisContext(BaseModel):
    """Optional diagnosis context passed from /results page."""
    disease: str | None = None
    crop: str | None = None
    confidence: float | None = None
    severity_tier: str | None = None
    affected_percentage: float | None = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    language: Language = Language.english
    crop: str | None = None
    district: str | None = None
    session_id: str | None = Field(default_factory=lambda: str(uuid4()))
    diagnosis_context: DiagnosisContext | None = None


class SourceItem(BaseModel):
    title: str = Field(..., description="Document or guideline title")
    source: str = Field(..., description="Publishing organization / institutional source")
    chunk_id: str | None = Field(default=None, description="Unique chunk identifier")


class ChatResponse(BaseModel):
    success: bool = True
    answer: str
    sources: list[SourceItem] = Field(
        default_factory=list,
        description="Verified knowledge sources",
    )
    language: Language
    session_id: str
    escalate: bool = False
    retrieval_score: float = 0.0
    is_mock: bool = False
