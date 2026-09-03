"""
Weather Service — Open-Meteo Integration + Predictive XGBoost Risk Model
========================================================================
Phase 2 Blueprint Implementation

Fetches 7-day weather forecast for a district centroid
and scores daily disease risk using an agronomic-feature-driven XGBoost model.

Open-Meteo is free, no API key required.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import httpx

from app.config import settings
from app.schemas.weather import DailyWeather, WeatherRiskResponse
from app.services.weather.risk_engine import predict_daily_risk, score_to_risk_label

logger = logging.getLogger(__name__)

# Open-Meteo variable names we request
_HOURLY_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "precipitation",
    "wind_speed_10m",
]


def _mock_forecast(district: str, crop: str) -> WeatherRiskResponse:
    """Return deterministic mock forecast with XGBoost risk scoring for fallback."""
    import random

    random.seed(hash(district + crop) % 1000)
    days = []
    for i in range(settings.open_meteo_forecast_days):
        t_mean = round(random.uniform(22.0, 36.0), 1)
        h_mean = round(random.uniform(45.0, 85.0), 1)
        rain = round(random.uniform(0.0, 15.0), 1)
        wind = round(random.uniform(5.0, 25.0), 1)

        # Mock feature approximations
        high_humid_hrs = (h_mean / 100.0) * 40.0
        risk_score, risk_label, primary_driver = predict_daily_risk(
            crop=crop,
            temp_mean=t_mean,
            high_humidity_hours_7d=high_humid_hrs,
            rainfall_3d=rain,
            month=8,
        )

        days.append(
            DailyWeather(
                date=f"2026-08-{24 + i:02d}",
                temperature_mean=t_mean,
                humidity_mean=h_mean,
                rainfall_mm=rain,
                wind_speed_kmh=wind,
                risk_score=risk_score,
                risk_label=risk_label,
                primary_driver=primary_driver,
            )
        )

    overall = round(sum(d.risk_score for d in days) / len(days), 2) if days else 0.0
    overall_label = score_to_risk_label(overall)
    overall_driver = days[0].primary_driver if days else "Seasonal baseline"

    return WeatherRiskResponse(
        district=district,
        crop=crop,
        forecast=days,
        overall_risk_score=overall,
        overall_risk_label=overall_label,
        primary_driver=overall_driver,
        is_mock=True,
    )


async def get_weather_risk(
    district: str,
    crop: str,
    lat: float,
    lon: float,
) -> WeatherRiskResponse:
    """
    Fetch Open-Meteo forecast for district centroid and compute XGBoost disease risk.

    Args:
        district: District name (for response label only).
        crop: Crop type.
        lat: District centroid latitude.
        lon: District centroid longitude.

    Returns:
        WeatherRiskResponse with 7-day daily forecast + XGBoost risk scores + primary drivers.
    """
    if settings.mock_ml_models:
        return _mock_forecast(district, crop)

    try:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": ",".join(_HOURLY_VARS),
            "forecast_days": settings.open_meteo_forecast_days,
            "timezone": "Asia/Karachi",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{settings.open_meteo_base_url}/forecast", params=params
            )
            resp.raise_for_status()
            data = resp.json()

        return _parse_forecast(data, district, crop)

    except Exception as exc:
        logger.exception(f"Open-Meteo request failed: {exc} — falling back to mock.")
        return _mock_forecast(district, crop)


def _parse_forecast(
    data: dict[str, Any], district: str, crop: str
) -> WeatherRiskResponse:
    """
    Parse Open-Meteo hourly response into daily aggregates + predictive XGBoost risk scores.
    """
    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    temps = hourly.get("temperature_2m", [])
    humids = hourly.get("relative_humidity_2m", [])
    precips = hourly.get("precipitation", [])
    winds = hourly.get("wind_speed_10m", [])

    # Group by day (24 hourly readings per day)
    daily_data: dict[str, list[dict[str, float]]] = {}
    for i, t in enumerate(times):
        day = t[:10]  # "YYYY-MM-DD"
        daily_data.setdefault(day, []).append(
            {
                "temp": float(temps[i]) if i < len(temps) else 0.0,
                "humid": float(humids[i]) if i < len(humids) else 0.0,
                "precip": float(precips[i]) if i < len(precips) else 0.0,
                "wind": float(winds[i]) if i < len(winds) else 0.0,
            }
        )

    # 1. Compute total high humidity hours across the 7-day window (hours where RH > 80%)
    all_readings = [r for rlist in daily_data.values() for r in rlist]
    total_high_humidity_hours_7d = sum(1.0 for r in all_readings if r["humid"] >= 80.0)

    # 2. Daily risk scoring
    forecast = []
    days_list = list(daily_data.items())[: settings.open_meteo_forecast_days]

    for idx, (day, readings) in enumerate(days_list):
        t_mean = sum(r["temp"] for r in readings) / len(readings)
        h_mean = sum(r["humid"] for r in readings) / len(readings)
        daily_rain = sum(r["precip"] for r in readings)
        wind_mean = sum(r["wind"] for r in readings) / len(readings)

        # 3-day accumulated rainfall window (current day + 2 surrounding days)
        start_idx = max(0, idx - 1)
        end_idx = min(len(days_list), idx + 2)
        rainfall_3d = sum(
            sum(r["precip"] for r in days_list[j][1]) for j in range(start_idx, end_idx)
        )

        month = 8
        try:
            month = datetime.strptime(day, "%Y-%m-%d").month
        except Exception:
            pass

        # Predict risk via XGBoost
        risk_score, risk_label, primary_driver = predict_daily_risk(
            crop=crop,
            temp_mean=t_mean,
            high_humidity_hours_7d=total_high_humidity_hours_7d,
            rainfall_3d=rainfall_3d,
            month=month,
        )

        forecast.append(
            DailyWeather(
                date=day,
                temperature_mean=round(t_mean, 1),
                humidity_mean=round(h_mean, 1),
                rainfall_mm=round(daily_rain, 1),
                wind_speed_kmh=round(wind_mean, 1),
                risk_score=risk_score,
                risk_label=risk_label,
                primary_driver=primary_driver,
            )
        )

    overall = round(sum(d.risk_score for d in forecast) / len(forecast), 2) if forecast else 0.0
    overall_label = score_to_risk_label(overall)

    # Strongest primary driver across the 7-day period
    driver_counts: dict[str, int] = {}
    for d in forecast:
        if d.primary_driver:
            driver_counts[d.primary_driver] = driver_counts.get(d.primary_driver, 0) + 1
    overall_driver = (
        max(driver_counts.items(), key=lambda x: x[1])[0]
        if driver_counts
        else "Temperature in pathogen optimal range"
    )

    return WeatherRiskResponse(
        district=district,
        crop=crop,
        forecast=forecast,
        overall_risk_score=overall,
        overall_risk_label=overall_label,
        primary_driver=overall_driver,
        is_mock=False,
    )
