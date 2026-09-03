"""
ML Module — EfficientNet-B0 Model
====================================
Provides:
  - build_model()        Create EfficientNet-B0 with a custom head
  - load_checkpoint()    Load weights + class names from a .pt file
  - get_device()         Auto-select CUDA / MPS / CPU
  - save_checkpoint()    Save model + metadata
"""
from __future__ import annotations

import json
import logging
from pathlib import Path

import torch
import torch.nn as nn

logger = logging.getLogger(__name__)


# ── Device selection ──────────────────────────────────────────────────────────

def get_device(device_override: str | None = None) -> torch.device:
    """
    Return the best available device.

    Priority: CUDA > MPS (Apple Silicon) > CPU
    Overridable by passing a device string (e.g. 'cpu', 'cuda:0').
    """
    if device_override:
        return torch.device(device_override)
    if torch.cuda.is_available():
        dev = torch.device("cuda")
        logger.info(f"Using GPU: {torch.cuda.get_device_name(0)}")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        dev = torch.device("mps")
        logger.info("Using MPS (Apple Silicon)")
    else:
        dev = torch.device("cpu")
        logger.info("Using CPU — training will be slow without a GPU")
    return dev


# ── Model factory ─────────────────────────────────────────────────────────────

def build_model(num_classes: int, pretrained: bool = True, dropout: float = 0.3) -> nn.Module:
    """
    Build EfficientNet-B0 with a custom classification head.

    The final fully-connected layer is replaced with:
        Dropout(dropout) → Linear(1280, num_classes)

    Args:
        num_classes: Number of output classes.
        pretrained: Whether to load ImageNet pretrained weights.
        dropout: Dropout probability before final layer.

    Returns:
        nn.Module: EfficientNet-B0 ready for fine-tuning or inference.
    """
    from torchvision.models import EfficientNet_B0_Weights, efficientnet_b0

    weights = EfficientNet_B0_Weights.DEFAULT if pretrained else None
    model = efficientnet_b0(weights=weights)

    # Replace the classifier head
    in_features = model.classifier[1].in_features  # 1280 for EfficientNet-B0
    model.classifier = nn.Sequential(
        nn.Dropout(p=dropout, inplace=True),
        nn.Linear(in_features, num_classes),
    )

    logger.info(
        f"Built EfficientNet-B0: {num_classes} classes, "
        f"{'pretrained' if pretrained else 'random'} weights, "
        f"dropout={dropout}"
    )
    return model


# ── Checkpoint I/O ────────────────────────────────────────────────────────────

def save_checkpoint(
    model: nn.Module,
    class_names: list[str],
    checkpoint_path: Path,
    classes_path: Path,
    epoch: int,
    val_acc: float,
    val_loss: float,
    config_dict: dict | None = None,
    seed: int = 42,
    image_size: int = 224,
) -> None:
    """
    Save model weights + metadata to a .pt checkpoint file.

    The checkpoint stores:
        - model state dict (state_dict & model_state_dict)
        - class names list
        - num_classes, image_size, normalization, model_architecture
        - training metadata (epoch, val_acc, val_loss, best_val_accuracy, seed)
    """
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "state_dict": model.state_dict(),
        "model_state_dict": model.state_dict(),
        "class_names": class_names,
        "num_classes": len(class_names),
        "image_size": image_size,
        "normalization": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225],
        },
        "model_architecture": "efficientnet_b0",
        "training_config": config_dict or {},
        "epoch": epoch,
        "val_acc": val_acc,
        "val_loss": val_loss,
        "best_val_accuracy": val_acc,
        "seed": seed,
        "training_seed": seed,
    }
    torch.save(payload, checkpoint_path)

    # Also save classes as JSON for easy inspection / non-Python use
    classes_path.parent.mkdir(parents=True, exist_ok=True)
    with open(classes_path, "w", encoding="utf-8") as f:
        json.dump(class_names, f, indent=2)

    logger.info(
        f"Checkpoint saved: {checkpoint_path} "
        f"(epoch={epoch}, val_acc={val_acc:.4f})"
    )


def load_checkpoint(
    checkpoint_path: Path,
    device: torch.device,
    dropout: float = 0.3,
) -> tuple[nn.Module, list[str]]:
    """
    Load a model checkpoint and return the model + class names.

    Args:
        checkpoint_path: Path to the .pt file produced by save_checkpoint().
        device: Target device for the loaded model.
        dropout: Must match the dropout used at training time.

    Returns:
        (model, class_names): Model in eval() mode + list of class name strings.

    Raises:
        FileNotFoundError: If the checkpoint file does not exist.
        KeyError: If the checkpoint is missing required keys.
    """
    if not checkpoint_path.exists():
        raise FileNotFoundError(
            f"Checkpoint not found: {checkpoint_path}\n"
            "Run ml/disease_classifier/train.py to train and save a checkpoint."
        )

    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)

    required_keys = {"state_dict", "class_names", "num_classes"}
    missing = required_keys - checkpoint.keys()
    if missing:
        raise KeyError(f"Checkpoint is missing keys: {missing}")

    class_names: list[str] = checkpoint["class_names"]
    num_classes: int = checkpoint["num_classes"]

    model = build_model(num_classes=num_classes, pretrained=False, dropout=dropout)
    model.load_state_dict(checkpoint["state_dict"])
    model.to(device)
    model.eval()

    logger.info(
        f"Loaded checkpoint: {checkpoint_path} | "
        f"classes={num_classes} | "
        f"epoch={checkpoint.get('epoch', '?')} | "
        f"val_acc={checkpoint.get('val_acc', '?')}"
    )
    return model, class_names
