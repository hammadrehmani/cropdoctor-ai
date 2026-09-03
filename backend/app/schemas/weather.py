"""Pydantic schemas — Weather & Risk endpoint."""
from __future__ import annotations

from pydantic import BaseModel, Field


class DailyWeather(BaseModel):
    date: str
    temperature_mean: float
    humidity_mean: float
    rainfall_mm: float
    wind_speed_kmh: float
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_label: str  # LOW | MEDIUM | HIGH | CRITICAL
    primary_driver: str | None = None


class WeatherRiskResponse(BaseModel):
    district: str
    crop: str
    forecast: list[DailyWeather]
    overall_risk_score: float = Field(..., ge=0.0, le=1.0)
    overall_risk_label: str
    primary_driver: str | None = None
    is_mock: bool = False
