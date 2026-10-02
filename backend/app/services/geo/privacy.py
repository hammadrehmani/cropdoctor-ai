"""
Geo Service — GPS Privacy Layer
=================================
Converts raw farmer GPS coordinates to anonymised district centroids.

PRIVACY CONTRACT:
  - Raw lat/lon coordinates are accepted as input but immediately discarded.
  - Only the district name and a fuzzed centroid (± 2 km jitter) are ever
    returned or stored.
  - This module is the ONLY place raw coordinates are processed.
"""
from __future__ import annotations

import json
import logging
import math
import random
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)

# Loaded once at startup
_districts: list[dict] = []


def load_districts() -> None:
    """Load district data from JSON file. Called at app startup."""
    global _districts
    path = Path(settings.districts_json_path)
    if not path.exists():
        for candidate in [
            Path("data/districts.json"),
            Path("../data/districts.json"),
            Path(__file__).resolve().parent.parent.parent.parent / "data" / "districts.json",
        ]:
            if candidate.exists():
                path = candidate
                break
    if not path.exists():
        logger.warning(f"Districts file not found at {path} — privacy layer unavailable.")
        return
    with open(path, encoding="utf-8") as f:
        _districts = json.load(f)
    logger.info(f"Loaded {len(_districts)} Pakistan districts.")


def coords_to_district(lat: float, lon: float) -> dict | None:
    """
    Map raw GPS coordinates to the nearest district centroid.

    Returns dict with keys: name, lat, lon (centroid — NOT farmer coords).
    Raw input coordinates are used only for distance calculation and
    are not stored or returned.
    """
    if not _districts:
        logger.warning("Districts not loaded — cannot anonymise coordinates.")
        return None

    nearest = min(
        _districts,
        key=lambda d: _haversine(lat, lon, d["lat"], d["lon"]),
    )
    return {"name": nearest["name"], "lat": nearest["lat"], "lon": nearest["lon"]}


def fuzz_coords(lat: float, lon: float, max_km: float = 2.0) -> tuple[float, float]:
    """
    Add random spatial jitter to centroid coordinates (≤ max_km radius).
    Used for map marker placement to prevent exact centroid identification.
    """
    # Convert km to degrees (approximate)
    km_per_degree = 111.0
    max_deg = max_km / km_per_degree

    angle = random.uniform(0, 2 * math.pi)
    radius = random.uniform(0, max_deg)
    return (
        round(lat + radius * math.cos(angle), 6),
        round(lon + radius * math.sin(angle), 6),
    )


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in km between two lat/lon points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
