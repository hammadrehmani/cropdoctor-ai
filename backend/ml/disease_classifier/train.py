"""
ML Module — Training Loop
===========================
Entry point: python -m ml.disease_classifier.train [--config-overrides]

Implements:
  - Detection of pre-split dataset (Train/Validation/Test) or dynamic split
  - Augmented training with AdamW and transfer learning (EfficientNet-B0)
  - Per-epoch validation with accuracy + loss tracking
  - Best checkpoint saving (by validation accuracy)
  - Early stopping
  - CSV training log for analysis
"""
from __future__ import annotations

import argparse
import csv
import logging
import time
from pathlib import Path

import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.utils.data import DataLoader

from ml.disease_classifier.config import MLConfig
from ml.disease_classifier.dataset import (
    PlantVillageDataset,
    get_eval_transforms,
    get_train_transforms,
    make_dataloaders,
    make_stratified_splits,
)
from ml.disease_classifier.model import build_model, get_device, save_checkpoint

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


# ── Training step ─────────────────────────────────────────────────────────────

def train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    optimizer: torch.optim.Optimizer,
    criterion: nn.Module,
    device: torch.device,
) -> tuple[float, float]:
    """Run one training epoch. Returns (avg_loss, accuracy)."""
    model.train()
    total_loss = 0.0
    correct = 0
    total = 0

    for batch_idx, (images, labels) in enumerate(loader):
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item() * images.size(0)
        preds = outputs.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total += images.size(0)

        if batch_idx % 20 == 0 or batch_idx == len(loader) - 1:
            logger.info(
                f"  Batch {batch_idx+1}/{len(loader)} — "
                f"loss={loss.item():.4f} "
                f"acc={correct/total:.4f}"
            )

    return total_loss / total, correct / total


# ── Validation step ───────────────────────────────────────────────────────────

@torch.no_grad()
def validate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> tuple[float, float]:
    """Run validation. Returns (avg_loss, accuracy)."""
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)
        total_loss += loss.item() * images.size(0)
        preds = outputs.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total += images.size(0)

    return total_loss / total, correct / total


# ── Main training function ────────────────────────────────────────────────────

def train_model(config: MLConfig) -> None:
    """
    Full training pipeline:
    1. Load dataset (pre-split Train/Validation/Test or dynamic split)
    2. Build EfficientNet-B0 model
    3. Train with AdamW & Cosine Annealing
    4. Save best checkpoint
    5. Write training log CSV
    """
    device = get_device(config.device)
    if device.type == "cpu":
        import os
        torch.set_num_threads(min(8, os.cpu_count() or 4))

    train_dir = config.dataset_root / "Train"
    val_dir = config.dataset_root / "Validation"
    test_dir = config.dataset_root / "Test"

    has_presplit = train_dir.exists() and val_dir.exists() and test_dir.exists()

    if has_presplit:
        logger.info(f"Detected pre-split dataset under: {config.dataset_root}")
        train_dataset = PlantVillageDataset(
            train_dir,
            transform=get_train_transforms(config.image_size, config)
            if config.augment_train
            else get_eval_transforms(config.image_size),
            cache_in_memory=True,
        )
        class_to_idx = train_dataset.class_to_idx

        val_dataset = PlantVillageDataset(
            val_dir,
            transform=get_eval_transforms(config.image_size),
            class_to_idx=class_to_idx,
            cache_in_memory=True,
        )
        test_dataset = PlantVillageDataset(
            test_dir,
            transform=get_eval_transforms(config.image_size),
            class_to_idx=class_to_idx,
            cache_in_memory=True,
        )

        class_names = train_dataset.class_names
        num_classes = len(class_names)
        config.num_classes = num_classes

        train_loader = DataLoader(
            train_dataset,
            batch_size=config.batch_size,
            shuffle=True,
            num_workers=config.num_workers,
            pin_memory=config.pin_memory,
        )
        val_loader = DataLoader(
            val_dataset,
            batch_size=config.batch_size,
            shuffle=False,
            num_workers=config.num_workers,
            pin_memory=config.pin_memory,
        )
        test_loader = DataLoader(
            test_dataset,
            batch_size=config.batch_size,
            shuffle=False,
            num_workers=config.num_workers,
            pin_memory=config.pin_memory,
        )

        n_train = len(train_dataset)
        n_val = len(val_dataset)
        n_test = len(test_dataset)

    else:
        logger.info(f"Loading raw dataset from: {config.dataset_root}")
        dataset = PlantVillageDataset(root=config.dataset_root)
        class_names = dataset.class_names
        num_classes = len(class_names)
        config.num_classes = num_classes

        train_sub, val_sub, test_sub = make_stratified_splits(dataset, config)
        train_loader, val_loader, test_loader = make_dataloaders(
            train_sub, val_sub, test_sub, config
        )
        n_train = len(train_sub)
        n_val = len(val_sub)
        n_test = len(test_sub)

    print("\n" + "=" * 60)
    print(f"Device: {device}")
    print(f"Dataset: {config.dataset_root.resolve()}")
    print(f"Classes ({num_classes}): {class_names}")
    print(f"Train images: {n_train}")
    print(f"Validation images: {n_val}")
    print(f"Test images: {n_test}")
    print("=" * 60 + "\n")

    # ── Model ─────────────────────────────────────────────────────────────────
    model = build_model(
        num_classes=num_classes,
        pretrained=config.pretrained,
        dropout=config.dropout,
    ).to(device)

    # ── Loss + optimiser ──────────────────────────────────────────────────────
    criterion = nn.CrossEntropyLoss(label_smoothing=config.label_smoothing)
    optimizer = AdamW(
        model.parameters(),
        lr=config.learning_rate,
        weight_decay=config.weight_decay,
    )
    scheduler = CosineAnnealingLR(optimizer, T_max=config.epochs, eta_min=1e-6)

    # ── Training loop ─────────────────────────────────────────────────────────
    best_val_acc = 0.0
    best_val_loss = float("inf")
    patience_counter = 0
    log_rows: list[dict] = []

    config.checkpoint_dir.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, config.epochs + 1):
        t0 = time.time()
        train_loss, train_acc = train_one_epoch(
            model, train_loader, optimizer, criterion, device
        )
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        scheduler.step()
        elapsed = time.time() - t0

        logger.info(
            f"Epoch {epoch:3d}/{config.epochs} | "
            f"train_loss={train_loss:.4f} train_accuracy={train_acc:.4f} | "
            f"validation_loss={val_loss:.4f} validation_accuracy={val_acc:.4f} | "
            f"{elapsed:.1f}s"
        )

        log_rows.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 6),
            "train_accuracy": round(train_acc, 6),
            "validation_loss": round(val_loss, 6),
            "validation_accuracy": round(val_acc, 6),
        })

        # Save best checkpoint by validation accuracy (break tie by val_loss)
        is_best = (val_acc > best_val_acc) or (val_acc == best_val_acc and val_loss < best_val_loss)
        if is_best:
            best_val_acc = val_acc
            best_val_loss = val_loss
            patience_counter = 0
            save_checkpoint(
                model=model,
                class_names=class_names,
                checkpoint_path=config.checkpoint_path,
                classes_path=config.classes_path,
                epoch=epoch,
                val_acc=val_acc,
                val_loss=val_loss,
                config_dict=config.__dict__ if hasattr(config, "__dict__") else {},
                image_size=config.image_size,
            )
            logger.info(
                f"  ✓ New best checkpoint saved (val_acc={val_acc:.4f}, val_loss={val_loss:.4f})"
            )
        else:
            patience_counter += 1
            if patience_counter >= config.early_stopping_patience:
                logger.info(
                    f"Early stopping triggered after {epoch} epochs "
                    f"(no improvement for {patience_counter} epochs)."
                )
                break

    # ── Save training log ─────────────────────────────────────────────────────
    log_path = config.checkpoint_dir / "training_log.csv"
    with open(log_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=log_rows[0].keys())
        writer.writeheader()
        writer.writerows(log_rows)
    logger.info(f"Training log saved: {log_path}")

    logger.info(
        f"\n{'='*60}\n"
        f"Training complete.\n"
        f"Best validation_accuracy={best_val_acc:.4f}, validation_loss={best_val_loss:.4f}\n"
        f"Checkpoint: {config.checkpoint_path}\n"
        f"{'='*60}\n"
    )


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train CropDoctor disease classifier")
    parser.add_argument("--dataset-root", type=Path, default=Path("../data/raw/plant_disease"))
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=0.0001)
    parser.add_argument("--checkpoint-dir", type=Path, default=Path("ml/models"))
    parser.add_argument("--device", type=str, default=None)
    parser.add_argument("--no-pretrained", action="store_true")
    args = parser.parse_args()

    cfg = MLConfig()
    cfg.dataset_root = args.dataset_root
    cfg.epochs = args.epochs
    cfg.batch_size = args.batch_size
    cfg.learning_rate = args.lr
    cfg.checkpoint_dir = args.checkpoint_dir
    if args.device:
        cfg.device = args.device
    if args.no_pretrained:
        cfg.pretrained = False

    train_model(cfg)
