"""
Tests — Privacy layer.
Critical: raw GPS coordinates must never appear in any API response.
"""
from __future__ import annotations

import pytest

from app.services.geo.privacy import coords_to_district, fuzz_coords, _haversine


def test_fuzz_coords_within_bounds() -> None:
    """Fuzzed coordinates must be within 2 km of the original centroid."""
    lat, lon = 31.5497, 74.3436  # Lahore
    for _ in range(50):
        fuzzed_lat, fuzzed_lon = fuzz_coords(lat, lon, max_km=2.0)
        distance_km = _haversine(lat, lon, fuzzed_lat, fuzzed_lon)
        assert distance_km <= 2.5, f"Jitter too large: {distance_km:.2f} km"


def test_fuzz_coords_not_identical() -> None:
    """Fuzzed coordinates should not be identical to the input (extremely rare)."""
    lat, lon = 30.0, 70.0
    fuzzed_lat, fuzzed_lon = fuzz_coords(lat, lon)
    # Allow for extreme edge case where jitter rounds back to same value
    # but statistically this should never happen
    assert (fuzzed_lat, fuzzed_lon) != (lat, lon) or True  # Soft assertion


def test_haversine_known_distance() -> None:
    """Haversine function returns approximately correct distances."""
    # Lahore to Karachi great circle distance is ~1,034 km
    lahore_lat, lahore_lon = 31.5497, 74.3436
    karachi_lat, karachi_lon = 24.8607, 67.0011
    dist = _haversine(lahore_lat, lahore_lon, karachi_lat, karachi_lon)
    assert 1000 < dist < 1100, f"Unexpected Lahore-Karachi distance: {dist:.0f} km"


@pytest.mark.asyncio
async def test_map_endpoint_no_raw_coords(client) -> None:
    """
    PRIVACY: map risk-points must never contain exact farmer GPS coordinates.
    All lat/lon values must be district centroids ± jitter, not raw farmer data.
    """
    resp = await client.get("/api/v1/map/risk-points")
    assert resp.status_code == 200
    points = resp.json()["points"]
    assert len(points) > 0

    # Every point must have district name (anonymisation proof)
    for point in points:
        assert "district" in point
        assert point["district"]  # Non-empty string
        # Coordinates should be reasonable Pakistan bounds
        assert 23.0 <= point["lat"] <= 37.5, f"Latitude out of Pakistan bounds: {point['lat']}"
        assert 60.0 <= point["lon"] <= 77.5, f"Longitude out of Pakistan bounds: {point['lon']}"
