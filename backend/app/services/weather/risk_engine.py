"""
Risk Engine Service — XGBoost Predictive Disease Risk Model
==========================================================
Phase 2 Blueprint Implementation

Transforms Open-Meteo hourly & daily weather data into agronomic features:
    1. high_humidity_hours_7d
    2. temp_in_optimal_range
    3. rainfall_3d
    4. crop_encoded
    5. season_encoded

Generates bounded outbreak risk probabilities [0.0, 1.0] using XGBoost predict_proba()
and identifies the primary model contributing feature (primary_driver).
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

# Optimal temperature ranges (°C) per crop for pathogen proliferation
OPTIMAL_TEMP_RANGES: dict[str, tuple[float, float]] = {
    "cotton": (25.0, 35.0),     # Bacterial blight / CLCuD vector optimal
    "wheat": (12.0, 25.0),      # Puccinia rust optimal
    "rice": (20.0, 30.0),       # Magnaporthe blast optimal
    "sugarcane": (22.0, 32.0),  # Colletotrichum red rot optimal
}

CROP_MAP: dict[str, int] = {
    "cotton": 0,
    "wheat": 1,
    "rice": 2,
    "sugarcane": 3,
}

_model: Any = None


def get_risk_model() -> Any:
    """Lazy load the trained XGBoost risk model."""
    global _model
    if _model is not None:
        return _model

    model_dir = Path(__file__).resolve().parents[3] / "ml" / "models"
    json_path = model_dir / "risk_model.json"
    joblib_path = model_dir / "risk_model.joblib"

    try:
        import xgboost as xgb

        if json_path.exists():
            clf = xgb.XGBClassifier()
            clf.load_model(str(json_path))
            _model = clf
            logger.info(f"XGBoost risk model loaded from JSON: {json_path}")
            return _model
        elif joblib_path.exists():
            import joblib

            _model = joblib.load(str(joblib_path))
            logger.info(f"XGBoost risk model loaded from Joblib: {joblib_path}")
            return _model
        else:
            logger.warning(
                "Trained XGBoost risk model not found on disk. Falling back to agronomic heuristic."
            )
            return None
    except Exception as exc:
        logger.exception(f"Failed to load XGBoost risk model: {exc}")
        return None


def get_current_season(month: int) -> int:
    """
    Returns season code:
        0 = Rabi (Nov - Apr)
        1 = Kharif (May - Oct)
        2 = Zaid (transitional)
    """
    if month in (11, 12, 1, 2, 3, 4):
        return 0  # Rabi
    elif month in (5, 6, 7, 8, 9, 10):
        return 1  # Kharif
    return 2


def check_optimal_temp(temp: float, crop: str) -> int:
    min_t, max_t = OPTIMAL_TEMP_RANGES.get(crop.lower(), (15.0, 30.0))
    return 1 if (min_t <= temp <= max_t) else 0


def determine_primary_driver(
    high_humidity_hours_7d: float,
    temp_in_optimal: int,
    rainfall_3d: float,
) -> str:
    """
    Identifies the strongest model contributing feature for the specific day's risk.
    Note: Feature importance indicates model influence, not physical causation.
    """
    if temp_in_optimal == 1 and high_humidity_hours_7d >= 36.0:
        return "High humidity duration with optimal temperature"
    elif temp_in_optimal == 1 and rainfall_3d >= 4.0:
        return "Recent rainfall with pathogen-favourable temperature"
    elif temp_in_optimal == 1:
        return "Temperature in pathogen optimal range"
    elif high_humidity_hours_7d >= 40.0:
        return "Extended relative humidity (>80% duration)"
    elif rainfall_3d >= 10.0:
        return "3-day accumulated rainfall"
    else:
        return "Seasonal baseline conditions"


def score_to_risk_label(score: float) -> str:
    if score >= 0.75:
        return "CRITICAL"
    elif score >= 0.50:
        return "HIGH"
    elif score >= 0.25:
        return "MEDIUM"
    return "LOW"


def predict_daily_risk(
    crop: str,
    temp_mean: float,
    high_humidity_hours_7d: float,
    rainfall_3d: float,
    month: int = 8,
) -> tuple[float, str, str]:
    """
    Predicts disease outbreak risk probability using XGBoost.

    Returns:
        tuple of (risk_score: float, risk_label: str, primary_driver: str)
    """
    crop_code = CROP_MAP.get(crop.lower(), 1)
    season_code = get_current_season(month)
    temp_in_optimal = check_optimal_temp(temp_mean, crop)

    features = np.array([
        [
            float(high_humidity_hours_7d),
            float(temp_in_optimal),
            float(rainfall_3d),
            float(crop_code),
            float(season_code),
        ]
    ], dtype=np.float32)

    model = get_risk_model()
    if model is not None:
        try:
            probs = model.predict_proba(features)
            # Outbreak probability (class 1)
            raw_prob = float(probs[0][1])
            risk_score = round(max(0.0, min(1.0, raw_prob)), 2)
        except Exception as exc:
            logger.warning(f"XGBoost predict_proba failed: {exc}. Using heuristic fallback.")
            risk_score = _heuristic_fallback(high_humidity_hours_7d, temp_in_optimal, rainfall_3d)
    else:
        risk_score = _heuristic_fallback(high_humidity_hours_7d, temp_in_optimal, rainfall_3d)

    risk_label = score_to_risk_label(risk_score)
    primary_driver = determine_primary_driver(high_humidity_hours_7d, temp_in_optimal, rainfall_3d)

    return risk_score, risk_label, primary_driver


def _heuristic_fallback(
    high_humidity_hours_7d: float,
    temp_in_optimal: int,
    rainfall_3d: float,
) -> float:
    """Deterministic fallback if model is unavailable."""
    score = 0.10
    if temp_in_optimal == 1:
        score += 0.30
    if high_humidity_hours_7d >= 36.0:
        score += 0.35
    elif high_humidity_hours_7d >= 20.0:
        score += 0.15
    if rainfall_3d >= 5.0:
        score += 0.20
    return round(min(1.0, score), 2)
