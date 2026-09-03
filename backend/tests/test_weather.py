"""
Tests — Weather & Predictive XGBoost Risk Endpoint (Phase 2 Blueprint).
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.services.weather.risk_engine import predict_daily_risk, get_risk_model


def test_xgboost_model_load_and_direct_prediction() -> None:
    """Verify the trained XGBoost model loads and outputs bounded probabilities."""
    model = get_risk_model()
    assert model is not None, "XGBoost risk model must be loaded from disk"

    # Test all 4 blueprint crops
    for crop in ["cotton", "wheat", "rice", "sugarcane"]:
        score, label, driver = predict_daily_risk(
            crop=crop,
            temp_mean=24.0,
            high_humidity_hours_7d=48.0,
            rainfall_3d=12.5,
            month=8,
        )
        assert 0.0 <= score <= 1.0, f"Risk score {score} out of [0, 1] range for {crop}"
        assert label in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
        assert len(driver) > 0, "Primary driver string must not be empty"


@pytest.mark.asyncio
async def test_weather_known_district(client: AsyncClient) -> None:
    """Weather endpoint returns 7-day forecast with XGBoost risk and primary_driver for a valid district."""
    resp = await client.get("/api/v1/weather/Faisalabad?crop=cotton")
    assert resp.status_code == 200
    body = resp.json()
    assert body["district"] == "Faisalabad"
    assert body["crop"] == "cotton"
    assert len(body["forecast"]) == 7
    assert 0.0 <= body["overall_risk_score"] <= 1.0
    assert body["overall_risk_label"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
    assert "primary_driver" in body
    assert body["primary_driver"] is not None

    for day in body["forecast"]:
        assert "date" in day
        assert "temperature_mean" in day
        assert "humidity_mean" in day
        assert "rainfall_mm" in day
        assert "wind_speed_kmh" in day
        assert 0.0 <= day["risk_score"] <= 1.0
        assert day["risk_label"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
        assert "primary_driver" in day
        assert day["primary_driver"] is not None


@pytest.mark.asyncio
async def test_weather_unknown_district_fallback(client: AsyncClient) -> None:
    """Unknown district falls back gracefully (returns 200 with valid forecast & risk)."""
    resp = await client.get("/api/v1/weather/Atlantis?crop=wheat")
    assert resp.status_code == 200
    body = resp.json()
    assert body["district"] == "Atlantis"
    assert len(body["forecast"]) == 7
    assert 0.0 <= body["overall_risk_score"] <= 1.0


@pytest.mark.asyncio
async def test_weather_all_crops(client: AsyncClient) -> None:
    """All four target crops return valid weather forecasts and risk predictions."""
    for crop in ["cotton", "wheat", "rice", "sugarcane"]:
        resp = await client.get(f"/api/v1/weather/Lahore?crop={crop}")
        assert resp.status_code == 200, f"Failed for crop: {crop}"
        body = resp.json()
        assert body["crop"] == crop
        assert len(body["forecast"]) == 7
        assert 0.0 <= body["overall_risk_score"] <= 1.0


@pytest.mark.asyncio
async def test_weather_no_raw_coords_in_response(client: AsyncClient) -> None:
    """Verify that no raw latitude/longitude is leaked in the weather response."""
    resp = await client.get("/api/v1/weather/Faisalabad?crop=wheat")
    assert resp.status_code == 200
    body = resp.json()
    assert "lat" not in body
    assert "lon" not in body
    assert "latitude" not in body
    assert "longitude" not in body
    assert "gps" not in body
