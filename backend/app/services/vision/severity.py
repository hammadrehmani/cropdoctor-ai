"""
Vision Service — Disease Severity Estimator
=============================================
Estimates the percentage of a leaf area affected by disease
using OpenCV-based HSV colour segmentation.

Method:
  1. Decode image to BGR → convert to HSV
  2. Isolate total leaf area using green channel mask (GrabCut optional)
  3. Build disease symptom mask across multiple colour ranges
  4. severity = symptom_pixels / leaf_pixels × 100

Severity tier mapping (configurable via Settings):
  < 5%  → "healthy"
  5–25% → "low"
  25–50%→ "moderate"
  ≥ 50% → "severe"

DISCLAIMER:
  This is a heuristic approach suitable for a hackathon demo.
  The thresholds and colour ranges are approximations and have NOT been
  clinically or scientifically validated. Do NOT present output as a
  precise agronomic measurement.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Literal

import numpy as np

logger = logging.getLogger(__name__)

SeverityTier = Literal["healthy", "low", "moderate", "severe"]

# ── HSV colour ranges for disease symptom pixels ───────────────────────────────
# Tuned to cover common symptoms: brown/rust lesions, yellow patches, dark necrosis
# Ranges are [H, S, V] in OpenCV scale (H: 0-179, S: 0-255, V: 0-255)
_SYMPTOM_RANGES = [
    # Brown / rust lesions (wheat rust pustules, brown spot)
    {"lower": np.array([8,  60,  40]),  "upper": np.array([22, 255, 210])},
    # Yellow / chlorosis patches (yellow rust, CLCuD yellowing)
    {"lower": np.array([20, 70,  80]),  "upper": np.array([38, 255, 255])},
    # Dark spots / necrosis (blast lesion centres, bacterial blight)
    {"lower": np.array([0,  0,   0]),   "upper": np.array([180, 50,  55])},
    # Reddish lesions (red rot, alternaria)
    {"lower": np.array([0,  60,  40]),  "upper": np.array([8,  255, 210])},
    # Orange-tan (some blast lesion edges)
    {"lower": np.array([5,  50,  60]),  "upper": np.array([15, 255, 200])},
]

# Leaf green mask range
_LEAF_GREEN_LOWER = np.array([30, 30, 30])
_LEAF_GREEN_UPPER = np.array([95, 255, 255])


@dataclass
class SeverityResult:
    affected_percentage: float
    """Estimated percentage of leaf area showing disease symptoms (0.0–100.0)."""

    severity_tier: SeverityTier
    """Categorical severity: healthy | low | moderate | severe."""

    leaf_pixels: int
    """Total detected leaf pixels (diagnostic)."""

    symptom_pixels: int
    """Detected symptom pixels (diagnostic)."""


def _percentage_to_tier(
    pct: float,
    threshold_low: float,
    threshold_moderate: float,
    threshold_severe: float,
) -> SeverityTier:
    if pct >= threshold_severe:
        return "severe"
    if pct >= threshold_moderate:
        return "moderate"
    if pct >= threshold_low:
        return "low"
    return "healthy"


async def estimate_severity(
    image_bytes: bytes,
    threshold_low: float = 5.0,
    threshold_moderate: float = 25.0,
    threshold_severe: float = 50.0,
) -> SeverityResult:
    """
    Estimate disease severity from raw image bytes.

    Args:
        image_bytes: Raw JPEG/PNG bytes.
        threshold_low: % above which severity is "low" (default 5%).
        threshold_moderate: % above which severity is "moderate" (default 25%).
        threshold_severe: % above which severity is "severe" (default 50%).

    Returns:
        SeverityResult with affected_percentage, severity_tier, and diagnostics.
    """
    try:
        import cv2

        # Decode
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            logger.warning("Severity: could not decode image — returning 0%.")
            return SeverityResult(0.0, "healthy", 0, 0)

        # Resize for consistent analysis (avoid resolution bias)
        img_bgr = cv2.resize(img_bgr, (512, 512), interpolation=cv2.INTER_AREA)
        img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

        # ── Leaf area mask ─────────────────────────────────────────────────
        leaf_mask = cv2.inRange(img_hsv, _LEAF_GREEN_LOWER, _LEAF_GREEN_UPPER)

        # Morphological cleanup: remove noise from leaf mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_CLOSE, kernel)
        leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_OPEN, kernel)

        leaf_pixels = int(np.sum(leaf_mask > 0))

        # Edge case: very little green → not a clear leaf image
        if leaf_pixels < 500:
            logger.debug("Severity: < 500 leaf pixels detected — image may not show leaf.")
            # Use full image area as denominator fallback
            leaf_pixels = img_bgr.shape[0] * img_bgr.shape[1]

        # ── Symptom mask ──────────────────────────────────────────────────
        symptom_mask = np.zeros(img_hsv.shape[:2], dtype=np.uint8)
        for r in _SYMPTOM_RANGES:
            symptom_mask = cv2.bitwise_or(
                symptom_mask,
                cv2.inRange(img_hsv, r["lower"], r["upper"]),
            )

        # Apply morphological cleanup to symptom mask too
        symptom_mask = cv2.morphologyEx(symptom_mask, cv2.MORPH_OPEN, kernel)

        symptom_pixels = int(np.sum(symptom_mask > 0))

        # ── Compute percentage ─────────────────────────────────────────────
        pct = min((symptom_pixels / max(leaf_pixels, 1)) * 100.0, 100.0)
        pct = round(pct, 1)

        tier = _percentage_to_tier(pct, threshold_low, threshold_moderate, threshold_severe)

        logger.debug(
            f"Severity: leaf={leaf_pixels}px, symptom={symptom_pixels}px, "
            f"pct={pct:.1f}%, tier={tier}"
        )

        return SeverityResult(
            affected_percentage=pct,
            severity_tier=tier,
            leaf_pixels=leaf_pixels,
            symptom_pixels=symptom_pixels,
        )

    except ImportError:
        logger.error("OpenCV not installed — returning fallback severity.")
        return SeverityResult(0.0, "healthy", 0, 0)

    except Exception as exc:
        logger.exception(f"Severity estimation error: {exc}")
        return SeverityResult(0.0, "healthy", 0, 0)
