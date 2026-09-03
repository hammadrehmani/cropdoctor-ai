"""
ML Config — Disease Classifier
================================
Single source of truth for all hyperparameters, paths, and thresholds.
All values are overridable from the FastAPI settings or CLI arguments.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class MLConfig:
    """Hyperparameters and paths for the disease classifier."""

    # ── Dataset ────────────────────────────────────────────────────────────────
    dataset_root: Path = field(default_factory=lambda: Path("../../data/raw"))
    """Root directory of the dataset. Each subdirectory is one class."""

    image_size: int = 224
    """Resize target for all images (EfficientNet-B0 expects 224×224)."""

    train_split: float = 0.70
    val_split: float = 0.15
    # test_split is inferred as 1 - train_split - val_split = 0.15

    # ── Model ──────────────────────────────────────────────────────────────────
    backbone: str = "efficientnet_b0"
    num_classes: int = 0  # 0 = auto-detect from dataset directory count
    pretrained: bool = True
    """Whether to start from ImageNet pretrained weights."""

    dropout: float = 0.3
    """Dropout added before the final classification layer."""

    # ── Training ───────────────────────────────────────────────────────────────
    epochs: int = 30
    batch_size: int = 32
    learning_rate: float = 1e-4
    weight_decay: float = 1e-4
    lr_scheduler: str = "cosine"  # cosine | step | none
    lr_warmup_epochs: int = 2
    label_smoothing: float = 0.1

    early_stopping_patience: int = 7
    """Stop training if val_loss does not improve for N epochs."""

    # ── Augmentation ───────────────────────────────────────────────────────────
    augment_train: bool = True
    random_flip: bool = True
    random_rotation_deg: int = 20
    color_jitter: bool = True
    random_erasing: bool = True

    # ── Checkpoint ─────────────────────────────────────────────────────────────
    checkpoint_dir: Path = field(default_factory=lambda: Path("../../backend/ml/models"))
    checkpoint_name: str = "classifier.pt"
    classes_name: str = "classifier_classes.json"

    @property
    def checkpoint_path(self) -> Path:
        return self.checkpoint_dir / self.checkpoint_name

    @property
    def classes_path(self) -> Path:
        return self.checkpoint_dir / self.classes_name

    # ── Inference ──────────────────────────────────────────────────────────────
    inference_confidence_threshold: float = 0.50
    """If top-1 confidence < this value, result is marked uncertain=True."""

    top_k: int = 5
    """Number of top predictions to return alongside the top-1 result."""

    # ── Hardware ───────────────────────────────────────────────────────────────
    device: str | None = None
    """None = auto (CUDA if available, else MPS if available, else CPU)."""

    num_workers: int = 0 if os.name == "nt" else 4
    pin_memory: bool = False

    # ── Severity ───────────────────────────────────────────────────────────────
    severity_threshold_low: float = 5.0
    severity_threshold_moderate: float = 25.0
    severity_threshold_severe: float = 50.0
    """
    Thresholds for mapping affected_percentage → severity tier:
        < low        → "healthy"
        low–moderate → "low"
        moderate–severe → "moderate"
        >= severe    → "severe"
    """


# Default config instance (used by scripts that don't supply their own)
default_config = MLConfig()
