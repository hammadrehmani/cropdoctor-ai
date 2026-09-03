"""
ML Module — Inference Engine
==============================
Provides InferenceEngine: a stateful service that loads a checkpoint once
and runs fast inference on image bytes.

Used by:
  - app/services/vision/classifier.py  (FastAPI service layer)
  - ml/disease_classifier/evaluate.py  (standalone evaluation)
  - Tests

Contract:
  - InferenceEngine.predict(image_bytes) → InferenceResult
  - uncertain=True when top-1 confidence < threshold
  - is_mock=False for real inference
  - NEVER silently returns mock when mock_mode=False and checkpoint missing
    → raises ModelNotLoadedError instead

IMPORTANT:
  This module reports what the model predicts.
  It does NOT fabricate confidence values or disease names.
  Confidence < threshold → uncertain=True, but the prediction is still shown
  with a clear disclaimer; routing to human expert is the caller's responsibility.
"""
from __future__ import annotations

import io
import logging
from dataclasses import dataclass
from typing import Any

from PIL import Image, UnidentifiedImageError

from ml.disease_classifier.config import MLConfig

logger = logging.getLogger(__name__)


# ── Custom exceptions ─────────────────────────────────────────────────────────

class ModelNotLoadedError(RuntimeError):
    """
    Raised when inference is requested but:
      - mock_mode is False, AND
      - no checkpoint has been loaded
    """
    pass


class CorruptImageError(ValueError):
    """Raised when the supplied image bytes cannot be decoded."""
    pass


# ── Result types ──────────────────────────────────────────────────────────────

@dataclass
class TopPrediction:
    disease: str
    confidence: float


@dataclass
class InferenceResult:
    disease: str
    """Top-1 predicted disease name."""

    confidence: float
    """Top-1 softmax probability (0.0–1.0)."""

    top_predictions: list[TopPrediction]
    """Top-k predictions sorted by confidence descending."""

    uncertain: bool
    """True when confidence < inference_confidence_threshold."""

    is_mock: bool
    """True when result is from mock/deterministic stub."""


# ── Deterministic mock stubs ──────────────────────────────────────────────────
# Used ONLY when mock_mode=True. Clearly labelled in the response.

_MOCK_DATA: dict[str, InferenceResult] = {
    "default": InferenceResult(
        disease="Wheat — Leaf Rust [MOCK]",
        confidence=0.87,
        top_predictions=[
            TopPrediction("Wheat — Leaf Rust [MOCK]", 0.87),
            TopPrediction("Wheat — Yellow Rust [MOCK]", 0.08),
            TopPrediction("Wheat — Healthy [MOCK]", 0.05),
        ],
        uncertain=False,
        is_mock=True,
    ),
    "cotton": InferenceResult(
        disease="Cotton — Leaf Curl Disease CLCuD [MOCK]",
        confidence=0.83,
        top_predictions=[
            TopPrediction("Cotton — Leaf Curl Disease CLCuD [MOCK]", 0.83),
            TopPrediction("Cotton — Bacterial Blight [MOCK]", 0.10),
            TopPrediction("Cotton — Healthy [MOCK]", 0.07),
        ],
        uncertain=False,
        is_mock=True,
    ),
    "wheat": InferenceResult(
        disease="Wheat — Leaf Rust [MOCK]",
        confidence=0.91,
        top_predictions=[
            TopPrediction("Wheat — Leaf Rust [MOCK]", 0.91),
            TopPrediction("Wheat — Yellow Rust [MOCK]", 0.06),
            TopPrediction("Wheat — Healthy [MOCK]", 0.03),
        ],
        uncertain=False,
        is_mock=True,
    ),
    "rice": InferenceResult(
        disease="Rice — Rice Blast [MOCK]",
        confidence=0.78,
        top_predictions=[
            TopPrediction("Rice — Rice Blast [MOCK]", 0.78),
            TopPrediction("Rice — Brown Spot [MOCK]", 0.15),
            TopPrediction("Rice — Healthy [MOCK]", 0.07),
        ],
        uncertain=False,
        is_mock=True,
    ),
    "sugarcane": InferenceResult(
        disease="Sugarcane — Red Rot [MOCK]",
        confidence=0.85,
        top_predictions=[
            TopPrediction("Sugarcane — Red Rot [MOCK]", 0.85),
            TopPrediction("Sugarcane — Smut [MOCK]", 0.10),
            TopPrediction("Sugarcane — Healthy [MOCK]", 0.05),
        ],
        uncertain=False,
        is_mock=True,
    ),
}


# ── Inference engine ──────────────────────────────────────────────────────────

class InferenceEngine:
    """
    Stateful inference service. Load once at application startup.

    Thread-safety: torch inference under GIL is safe for read-only forward pass.
    For high-concurrency production use, consider a model pool.
    """

    def __init__(
        self,
        config: MLConfig,
        mock_mode: bool = True,
    ) -> None:
        self._config = config
        self._mock_mode = mock_mode
        self._model: Any | None = None
        self._class_names: list[str] = []
        self._device: Any | None = None
        self._transform: Any | None = None
        self._loaded = False

    # ── Public API ─────────────────────────────────────────────────────────────

    def load(self) -> None:
        """
        Load model checkpoint. Called once at application startup.

        If mock_mode=True: logs a warning and returns without loading.
        If mock_mode=False and checkpoint missing/PyTorch missing: logs error (loaded=False).
        """
        if self._mock_mode:
            logger.warning(
                "InferenceEngine: DIAGNOSIS_MOCK_MODE=true — "
                "returning labelled mock predictions. "
                "Set DIAGNOSIS_MOCK_MODE=false and provide a checkpoint for real inference."
            )
            self._loaded = False
            return

        checkpoint_path = self._config.checkpoint_path
        try:
            from ml.disease_classifier.dataset import get_eval_transforms
            from ml.disease_classifier.model import get_device, load_checkpoint

            self._device = get_device(self._config.device)
            self._transform = get_eval_transforms(self._config.image_size)
            self._model, self._class_names = load_checkpoint(
                checkpoint_path, self._device, self._config.dropout
            )
            self._loaded = True
            logger.info(
                f"InferenceEngine loaded: {len(self._class_names)} classes, "
                f"device={self._device}"
            )
        except (FileNotFoundError, ImportError, RuntimeError) as exc:
            logger.error(
                f"InferenceEngine: could not load model ({exc}). "
                f"Ensure PyTorch is installed and checkpoint exists at {checkpoint_path}."
            )
            self._loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def is_mock(self) -> bool:
        return self._mock_mode

    def predict(
        self,
        image_bytes: bytes,
        crop_hint: str | None = None,
    ) -> InferenceResult:
        """
        Run disease classification on image bytes.

        Args:
            image_bytes: Raw bytes of a JPEG/PNG image.
            crop_hint: Optional crop type hint ('cotton','wheat','rice','sugarcane').
                       Used to select the right mock stub; ignored in real mode.

        Returns:
            InferenceResult with disease, confidence, top_predictions, uncertain, is_mock.

        Raises:
            ModelNotLoadedError: If mock_mode=False and no checkpoint is loaded.
            CorruptImageError: If image_bytes cannot be decoded.
        """
        # ── Mock mode ───────────────────────────────────────────────────────
        if self._mock_mode:
            key = (crop_hint or "default").lower()
            result = _MOCK_DATA.get(key, _MOCK_DATA["default"])
            logger.debug(f"InferenceEngine [MOCK]: {result.disease}")
            return result

        # ── Real mode — model must be loaded ───────────────────────────────
        if not self._loaded or self._model is None:
            raise ModelNotLoadedError(
                "InferenceEngine: mock_mode=False but no model is loaded. "
                "Place a checkpoint at the configured path and restart the server."
            )

        import torch
        import torch.nn.functional as F

        # ── Image decoding ──────────────────────────────────────────────────
        tensor = self._decode_image(image_bytes)

        # ── Forward pass ────────────────────────────────────────────────────
        with torch.no_grad():
            tensor = tensor.unsqueeze(0).to(self._device)
            logits = self._model(tensor)
            probs = F.softmax(logits, dim=1).squeeze(0)

        # ── Build result ─────────────────────────────────────────────────────
        top_k = min(self._config.top_k, len(self._class_names))
        top_probs, top_indices = probs.topk(top_k)

        top_predictions = [
            TopPrediction(
                disease=self._class_names[idx.item()],
                confidence=round(prob.item(), 4),
            )
            for prob, idx in zip(top_probs, top_indices)
        ]

        best = top_predictions[0]
        uncertain = best.confidence < self._config.inference_confidence_threshold

        logger.info(
            f"InferenceEngine: {best.disease} "
            f"conf={best.confidence:.3f} uncertain={uncertain}"
        )

        return InferenceResult(
            disease=best.disease,
            confidence=best.confidence,
            top_predictions=top_predictions,
            uncertain=uncertain,
            is_mock=False,
        )

    # ── Private helpers ────────────────────────────────────────────────────────

    def _decode_image(self, image_bytes: bytes) -> Any:
        """Decode raw bytes to a normalised tensor."""
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except (UnidentifiedImageError, OSError, SyntaxError) as exc:
            raise CorruptImageError(
                f"Cannot decode image: {exc}. "
                "Ensure the file is a valid JPEG, PNG, or WebP."
            ) from exc
        if self._transform is None:
            from ml.disease_classifier.dataset import get_eval_transforms
            self._transform = get_eval_transforms(self._config.image_size)
        return self._transform(img)
