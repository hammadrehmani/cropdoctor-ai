"""API route — Weather & Disease Risk."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.diagnosis import CropType
from app.schemas.weather import WeatherRiskResponse
from app.services.geo.privacy import _districts
from app.services.weather.open_meteo import get_weather_risk

router = APIRouter(prefix="/weather", tags=["weather"])


def _get_district_centroid(district_name: str) -> tuple[float, float] | None:
    """Look up centroid lat/lon for a named district."""
    for d in _districts:
        if d["name"].lower() == district_name.lower():
            return d["lat"], d["lon"]
    return None


@router.get(
    "/{district}",
    response_model=WeatherRiskResponse,
    summary="Get 7-day weather forecast and disease risk for a district",
)
async def weather_risk(
    district: str,
    crop: CropType = Query(..., description="Crop type for risk calculation"),
) -> WeatherRiskResponse:
    """
    Returns a 7-day weather forecast and computed disease risk scores
    for the specified Pakistan district.
    """
    # Look up district centroid (or use Lahore as fallback for demo)
    centroid = _get_district_centroid(district)
    if centroid is None:
        # Graceful fallback for demo: use Lahore centroid
        lat, lon = 31.5497, 74.3436
    else:
        lat, lon = centroid

    return await get_weather_risk(district=district, crop=crop.value, lat=lat, lon=lon)
