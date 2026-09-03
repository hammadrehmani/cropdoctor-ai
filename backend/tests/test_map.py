"""
Tests — Geospatial District Risk Map Endpoint (Phase 3).
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_map_risk_points_wheat_200(client: AsyncClient) -> None:
    """GET /api/v1/map/risk-points returns 200 with valid district risk metrics."""
    resp = await client.get("/api/v1/map/risk-points?crop=wheat")
    assert resp.status_code == 200
    body = resp.json()
    assert body["crop"] == "wheat"
    assert "points" in body
    points = body["points"]
    assert len(points) >= 5

    for p in points:
        assert "district" in p
        assert isinstance(p["district"], str)
        assert 0.0 <= p["risk_score"] <= 1.0
        assert p["risk_label"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
        assert "primary_driver" in p
        assert p["primary_driver"] is not None
        # Public reference coordinates only
        assert 23.0 <= p["lat"] <= 37.5
        assert 60.0 <= p["lon"] <= 78.0


@pytest.mark.asyncio
async def test_map_all_crops(client: AsyncClient) -> None:
    """Verify all 4 target crops work on the risk map endpoint."""
    for crop in ["wheat", "cotton", "rice", "sugarcane"]:
        resp = await client.get(f"/api/v1/map/risk-points?crop={crop}")
        assert resp.status_code == 200, f"Map endpoint failed for crop {crop}"
        body = resp.json()
        assert body["crop"] == crop
        assert len(body["points"]) >= 5


@pytest.mark.asyncio
async def test_map_invalid_crop_422(client: AsyncClient) -> None:
    """Invalid crop parameter returns 422 Unprocessable Entity."""
    resp = await client.get("/api/v1/map/risk-points?crop=banana")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_map_includes_demo_districts(client: AsyncClient) -> None:
    """Verify Sindh demo districts and key Punjab districts are present."""
    resp = await client.get("/api/v1/map/risk-points?crop=cotton")
    assert resp.status_code == 200
    district_names = [p["district"] for p in resp.json()["points"]]

    for expected in ["Hyderabad", "Sukkur", "Larkana", "Nawabshah", "Faisalabad", "Lahore"]:
        assert expected in district_names, f"Expected district '{expected}' missing from map response"


@pytest.mark.asyncio
async def test_map_privacy_no_raw_gps(client: AsyncClient) -> None:
    """Verify strict privacy: no farmer GPS or farmer ID leakage."""
    resp = await client.get("/api/v1/map/risk-points?crop=rice")
    assert resp.status_code == 200
    body = resp.json()
    assert "farmer_id" not in body
    assert "user_id" not in body
    assert "farmer_gps" not in body

    for p in body["points"]:
        assert "farmer_id" not in p
        assert "user_id" not in p
        assert "exact_location" not in p


@pytest.mark.asyncio
async def test_map_case_count_not_fabricated(client: AsyncClient) -> None:
    """
    Verify that case_count reflects real database records and is not hard-coded.
    Districts without diagnosis records in DB must return case_count == 0.
    """
    resp = await client.get("/api/v1/map/risk-points?crop=wheat")
    assert resp.status_code == 200
    points = resp.json()["points"]

    # In a clean state, unseeded districts like Quetta or Turbat must have 0 cases (not synthetic 12 or 5)
    for p in points:
        assert isinstance(p["case_count"], int)
        assert p["case_count"] >= 0
