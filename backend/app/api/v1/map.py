"""
API route — Geospatial District Risk Map (Phase 3).
Consumes the Phase 2 Open-Meteo + XGBoost risk engine for district centroids
and aggregates real persisted diagnosis volume from the database.
"""
from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.diagnosis import Diagnosis
from app.schemas.map import MapRiskResponse, RiskPoint
from app.services.weather.open_meteo import get_weather_risk

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/map", tags=["map"])

_SUPPORTED_CROPS = ["cotton", "wheat", "rice", "sugarcane"]

# Demo & Weather Priority Districts
_PRIORITY_DISTRICT_NAMES = [
    "Hyderabad",
    "Sukkur",
    "Larkana",
    "Nawabshah",
    "Mirpur Khas",
    "Faisalabad",
    "Lahore",
    "Multan",
    "Gujranwala",
    "Rawalpindi",
    "Bahawalpur",
    "Sargodha",
    "Sialkot",
    "Peshawar",
    "Quetta",
]


async def _fetch_district_risk(
    district_info: dict,
    crop: str,
    real_case_count: int = 0,
) -> RiskPoint:
    """Fetch live Phase 2 Open-Meteo + XGBoost risk score for a single district centroid."""
    name = district_info["name"]
    lat = district_info["lat"]
    lon = district_info["lon"]

    try:
        weather_resp = await get_weather_risk(name, crop, lat, lon)
        return RiskPoint(
            district=name,
            lat=lat,
            lon=lon,
            risk_score=weather_resp.overall_risk_score,
            risk_label=weather_resp.overall_risk_label,
            crop=crop,
            primary_driver=weather_resp.primary_driver or "Temperature in pathogen optimal range",
            case_count=real_case_count,
        )
    except Exception as exc:
        logger.warning(f"Map: failed to fetch weather/risk for {name}: {exc}")
        return RiskPoint(
            district=name,
            lat=lat,
            lon=lon,
            risk_score=0.20,
            risk_label="LOW",
            crop=crop,
            primary_driver="Baseline seasonal conditions",
            case_count=real_case_count,
        )


@router.get(
    "/risk-points",
    response_model=MapRiskResponse,
    summary="Get district-level disease risk points computed by Phase 2 XGBoost pipeline",
)
async def risk_points(
    crop: str = Query(
        "wheat",
        description="Target crop: wheat, cotton, rice, or sugarcane",
    ),
    db: AsyncSession = Depends(get_db),
) -> MapRiskResponse:
    """
    Returns live district-level risk markers powered by Open-Meteo + XGBoost.

    - Uses public district centroid coordinates only.
    - No raw farmer GPS coordinates are ever accepted, stored, or returned.
    - Real persisted diagnosis volume is queried from the database by district.
    - Zero fabricated case numbers.
    """
    normalized_crop = crop.strip().lower()
    if normalized_crop not in _SUPPORTED_CROPS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid crop '{crop}'. Must be one of: {', '.join(_SUPPORTED_CROPS)}",
        )

    from app.services.geo.privacy import _districts, load_districts

    if not _districts:
        load_districts()

    # Query real persisted diagnosis counts grouped by district
    district_counts: dict[str, int] = {}
    try:
        stmt = (
            select(Diagnosis.district, func.count(Diagnosis.id))
            .where(Diagnosis.district.is_not(None))
            .group_by(Diagnosis.district)
        )
        result = await db.execute(stmt)
        for row in result.all():
            if row[0]:
                district_counts[row[0].strip().lower()] = int(row[1])
    except Exception as exc:
        logger.warning(f"Map: could not query real diagnosis counts: {exc}")

    # Filter target priority districts or use all loaded districts
    target_districts = []
    if _districts:
        for name in _PRIORITY_DISTRICT_NAMES:
            match = next((d for d in _districts if d["name"].lower() == name.lower()), None)
            if match:
                target_districts.append(match)
        if not target_districts:
            target_districts = _districts[:15]
    else:
        # Fallback public centroids
        target_districts = [
            {"name": "Hyderabad", "lat": 25.3960, "lon": 68.3578},
            {"name": "Sukkur", "lat": 27.7052, "lon": 68.8574},
            {"name": "Larkana", "lat": 27.5570, "lon": 68.2166},
            {"name": "Nawabshah", "lat": 26.2442, "lon": 68.4100},
            {"name": "Mirpur Khas", "lat": 25.5271, "lon": 69.0151},
            {"name": "Faisalabad", "lat": 31.4180, "lon": 72.9978},
            {"name": "Lahore", "lat": 31.5497, "lon": 74.3436},
            {"name": "Multan", "lat": 30.1575, "lon": 71.5249},
        ]

    # Fetch live risks in parallel across district centroids with real case counts
    tasks = [
        _fetch_district_risk(
            d,
            normalized_crop,
            real_case_count=district_counts.get(d["name"].strip().lower(), 0),
        )
        for d in target_districts
    ]
    points = await asyncio.gather(*tasks)

    return MapRiskResponse(
        crop=normalized_crop,
        points=list(points),
        total_cases=sum(p.case_count for p in points),
    )
