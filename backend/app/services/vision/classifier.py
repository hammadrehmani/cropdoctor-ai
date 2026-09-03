"""
Vision Service — Disease Classifier (FastAPI layer)
=====================================================
Wraps ml.disease_classifier.InferenceEngine for use in FastAPI.

Responsibilities:
  - Singleton lifecycle (loaded once at app startup)
  - Expose the loaded model to GradCAM service
  - Translate InferenceEngine exceptions to FastAPI HTTP errors
  - Honour DIAGNOSIS_MOCK_MODE setting

Loading behaviour:
  DIAGNOSIS_MOCK_MODE=true  → mock InferenceEngine (no checkpoint needed)
  DIAGNOSIS_MOCK_MODE=false → real InferenceEngine
    → checkpoint missing    → model unavailable (logged, _loaded=False)
    → checkpoint present    → fully loaded (_loaded=True)
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from app.config import settings

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


class DiseaseClassifierService:
    """
    FastAPI-layer wrapper around the ML InferenceEngine.
    Instantiated once at module level; loaded during lifespan startup.
    """

    def __init__(self) -> None:
        self._engine: object | None = None
        self._loaded: bool = False
        self._model: object | None = None  # Exposed for GradCAM

    # ── Startup ────────────────────────────────────────────────────────────────

    def load(self) -> None:
        """Called once during FastAPI lifespan startup."""
        try:
            from ml.disease_classifier.config import MLConfig
            from ml.disease_classifier.inference import InferenceEngine

            ml_config = MLConfig(
                checkpoint_dir=settings.classifier_checkpoint.parent,
                checkpoint_name=settings.classifier_checkpoint.name,
                inference_confidence_threshold=settings.inference_confidence_threshold,
                device=None,  # auto-detect
            )

            self._engine = InferenceEngine(
                config=ml_config,
                mock_mode=settings.diagnosis_mock_mode,
            )
            self._engine.load()  # type: ignore[union-attr]

            if not settings.diagnosis_mock_mode and self._engine.is_loaded:  # type: ignore
                # Expose raw model reference for GradCAM
                self._model = self._engine._model  # type: ignore[union-attr]

            self._loaded = self._engine.is_loaded  # type: ignore[union-attr]

        except Exception as exc:
            logger.exception(f"DiseaseClassifierService failed to load: {exc}")
            self._loaded = False

    # ── Properties ─────────────────────────────────────────────────────────────

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def is_mock(self) -> bool:
        return settings.diagnosis_mock_mode

    @property
    def raw_model(self) -> object | None:
        """Raw nn.Module — used by GradCAMService. None in mock mode."""
        return self._model

    # ── Prediction ─────────────────────────────────────────────────────────────

    async def predict(self, image_bytes: bytes, crop: str | None = None) -> dict:
        """
        Run inference on image bytes.

        Returns dict with keys matching /analyze response schema.
        Raises:
            HTTPException(503) — if mock_mode=False and model not loaded
            HTTPException(400) — if image is corrupt/unreadable
        """
        from fastapi import HTTPException

        from ml.disease_classifier.inference import (
            CorruptImageError,
            ModelNotLoadedError,
        )

        if self._engine is None:
            if not settings.diagnosis_mock_mode:
                raise HTTPException(
                    status_code=503,
                    detail=(
                        "Disease classifier is not loaded. "
                        "Set DIAGNOSIS_MOCK_MODE=true for demo mode, "
                        "or place a trained checkpoint at the configured path."
                    ),
                )
            # Engine failed to init even in mock mode — return safe fallback
            logger.error("Engine not initialized — returning emergency fallback.")
            return {
                "disease": "Unknown [SERVICE UNAVAILABLE]",
                "confidence": 0.0,
                "top_predictions": [],
                "uncertain": True,
                "is_mock": True,
            }

        try:
            result = self._engine.predict(image_bytes, crop_hint=crop)  # type: ignore
            return {
                "disease": result.disease,
                "confidence": result.confidence,
                "top_predictions": [
                    {"disease": p.disease, "confidence": p.confidence}
                    for p in result.top_predictions
                ],
                "uncertain": result.uncertain,
                "is_mock": result.is_mock,
            }
        except ModelNotLoadedError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except CorruptImageError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            logger.exception(f"Inference error: {exc}")
            raise HTTPException(
                status_code=500,
                detail="Inference failed. Check server logs for details.",
            ) from exc


# ── Module singleton ───────────────────────────────────────────────────────────
classifier = DiseaseClassifierService()
