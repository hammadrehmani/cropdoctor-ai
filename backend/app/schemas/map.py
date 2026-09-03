"""
Pydantic schemas — Map / Geospatial District Risk Points endpoint.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class RiskPoint(BaseModel):
    """A single anonymised district-level risk marker for the geospatial map."""

    district: str
    lat: float = Field(..., description="District centroid public latitude (never farmer GPS)")
    lon: float = Field(..., description="District centroid public longitude (never farmer GPS)")
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_label: str  # LOW | MEDIUM | HIGH | CRITICAL
    crop: str = "wheat"
    primary_driver: str | None = None
    case_count: int = Field(default=0, description="Anonymised aggregated scan volume")


class MapRiskResponse(BaseModel):
    crop: str = "wheat"
    points: list[RiskPoint]
    total_cases: int = 0
