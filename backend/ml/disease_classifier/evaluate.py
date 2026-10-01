"""
ML Module — Test Set Evaluation
===============================
Loads a trained checkpoint and evaluates ONCE on the official Test set.

Usage:
    cd backend
    python -m ml.disease_classifier.evaluate \\
        --checkpoint ml/models/classifier.pt \\
        --dataset-root ../data/raw/plant_disease

Outputs:
  - Top-1 accuracy, Precision, Recall, F1 (macro & weighted)
  - Per-class metrics
  - Confusion matrix saved to backend/ml/models/confusion_matrix_test.csv
  - Classification report saved to backend/ml/models/classification_report.txt
"""
from __future__ import annotations

import argparse
import csv
import logging
from pathlib import Path

import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader

from ml.disease_classifier.config import MLConfig
from ml.disease_classifier.dataset import (
    PlantVillageDataset,
    get_eval_transforms,
    make_dataloaders,
    make_stratified_splits,
)
from ml.disease_classifier.model import get_device, load_checkpoint

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@torch.no_grad()
def evaluate_checkpoint(
    checkpoint_path: Path,
    dataset_root: Path,
    config: MLConfig | None = None,
    split: str = "test",
) -> dict:
    """
    Evaluate a saved checkpoint on the specified split (default: Test).
    """
    if config is None:
        config = MLConfig()
        config.dataset_root = dataset_root
        config.checkpoint_dir = checkpoint_path.parent

    device = get_device(config.device)
    model, class_names = load_checkpoint(checkpoint_path, device, config.dropout)
    num_classes = len(class_names)

    test_dir = dataset_root / ("Test" if split == "test" else "Validation")

    if test_dir.exists():
        logger.info(f"Loading {split} split directly from: {test_dir}")
        # Build class_to_idx mapping corresponding to class_names
        class_to_idx = {name: i for i, name in enumerate(class_names)}
        eval_dataset = PlantVillageDataset(
            test_dir,
            transform=get_eval_transforms(config.image_size),
            class_to_idx=class_to_idx,
        )
        eval_loader = DataLoader(
            eval_dataset,
            batch_size=config.batch_size,
            shuffle=False,
            num_workers=config.num_workers,
            pin_memory=config.pin_memory,
        )
    else:
        logger.info(f"Loading raw dataset from {dataset_root} and applying split {split}")
        dataset = PlantVillageDataset(root=dataset_root)
        _, val_sub, test_sub = make_stratified_splits(dataset, config)
        _, val_loader, test_loader = make_dataloaders(val_sub, val_sub, test_sub, config)
        eval_loader = test_loader if split == "test" else val_loader

    # ── Inference ─────────────────────────────────────────────────────────────
    all_labels: list[int] = []
    all_preds: list[int] = []
    total = 0

    model.eval()
    for images, labels in eval_loader:
        images = images.to(device)
        logits = model(images)
        probs = F.softmax(logits, dim=1)
        top1 = probs.argmax(dim=1).cpu().tolist()

        all_labels.extend(labels.tolist())
        all_preds.extend(top1)
        total += images.size(0)

    # ── Calculate Metrics ─────────────────────────────────────────────────────
    top1_correct = sum(p == true_lbl for p, true_lbl in zip(all_preds, all_labels))
    top1_acc = top1_correct / total if total > 0 else 0.0

    # Per-class metrics calculation
    tp = [0] * num_classes
    fp = [0] * num_classes
    fn = [0] * num_classes
    support = [0] * num_classes

    for pred, true_lbl in zip(all_preds, all_labels):
        support[true_lbl] += 1
        if pred == true_lbl:
            tp[true_lbl] += 1
        else:
            fp[pred] += 1
            fn[true_lbl] += 1

    per_class_precision = {}
    per_class_recall = {}
    per_class_f1 = {}
    per_class_acc = {}

    for i in range(num_classes):
        cls_name = class_names[i]
        prec = tp[i] / (tp[i] + fp[i]) if (tp[i] + fp[i]) > 0 else 0.0
        rec = tp[i] / (tp[i] + fn[i]) if (tp[i] + fn[i]) > 0 else 0.0
        f1 = 2 * (prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        acc = tp[i] / support[i] if support[i] > 0 else 0.0

        per_class_precision[cls_name] = prec
        per_class_recall[cls_name] = rec
        per_class_f1[cls_name] = f1
        per_class_acc[cls_name] = acc

    macro_precision = sum(per_class_precision.values()) / num_classes
    macro_recall = sum(per_class_recall.values()) / num_classes
    macro_f1 = sum(per_class_f1.values()) / num_classes

    weighted_precision = (
        sum(per_class_precision[cls] * support[i] for i, cls in enumerate(class_names)) / total
    )
    weighted_recall = (
        sum(per_class_recall[cls] * support[i] for i, cls in enumerate(class_names)) / total
    )
    weighted_f1 = (
        sum(per_class_f1[cls] * support[i] for i, cls in enumerate(class_names)) / total
    )

    # ── Confusion Matrix ──────────────────────────────────────────────────────
    conf_matrix = [[0] * num_classes for _ in range(num_classes)]
    for pred, true_lbl in zip(all_preds, all_labels):
        conf_matrix[true_lbl][pred] += 1

    # Save confusion matrix CSV
    cm_filename = f"confusion_matrix_{split}.csv"
    cm_path = checkpoint_path.parent / cm_filename
    with open(cm_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["true\\pred"] + class_names)
        for i, row in enumerate(conf_matrix):
            writer.writerow([class_names[i]] + row)

    # ── Save Classification Report ─────────────────────────────────────────────
    report_path = checkpoint_path.parent / "classification_report.txt"
    col_hdr = (
        f"{'Class Name':<15} | {'Support':<8} | {'Accuracy':<10} | "
        f"{'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}"
    )
    report_lines = [
        "======================================================================",
        "Plant-Disease dataset test-set performance",
        "======================================================================",
        f"Checkpoint evaluated: {checkpoint_path}",
        f"Split evaluated: {split.upper()} set ({total} images)",
        "",
        f"Top-1 Accuracy:     {top1_acc:.4f} ({top1_correct}/{total})",
        f"Macro Precision:    {macro_precision:.4f}",
        f"Macro Recall:       {macro_recall:.4f}",
        f"Macro F1 Score:     {macro_f1:.4f}",
        f"Weighted Precision: {weighted_precision:.4f}",
        f"Weighted Recall:    {weighted_recall:.4f}",
        f"Weighted F1 Score:  {weighted_f1:.4f}",
        "",
        "PER-CLASS METRICS:",
        col_hdr,
        "-" * 78,
    ]
    for i, cls in enumerate(class_names):
        row_str = (
            f"{cls:<15} | {support[i]:<8} | {per_class_acc[cls]:<10.4f} | "
            f"{per_class_precision[cls]:<10.4f} | {per_class_recall[cls]:<10.4f} | "
            f"{per_class_f1[cls]:<10.4f}"
        )
        report_lines.append(row_str)
    report_lines.append("======================================================================")

    report_text = "\n".join(report_lines)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_text)

    print("\n" + report_text + "\n")
    logger.info(f"Saved confusion matrix: {cm_path}")
    logger.info(f"Saved classification report: {report_path}")

    return {
        "top1_acc": top1_acc,
        "macro_precision": macro_precision,
        "macro_recall": macro_recall,
        "macro_f1": macro_f1,
        "weighted_precision": weighted_precision,
        "weighted_recall": weighted_recall,
        "weighted_f1": weighted_f1,
        "per_class_acc": per_class_acc,
        "per_class_precision": per_class_precision,
        "per_class_recall": per_class_recall,
        "per_class_f1": per_class_f1,
        "class_names": class_names,
        "total_samples": total,
        "confusion_matrix": conf_matrix,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate CropDoctor disease classifier")
    parser.add_argument("--checkpoint", type=Path, default=Path("ml/models/classifier.pt"))
    parser.add_argument("--dataset-root", type=Path, default=Path("../data/raw/plant_disease"))
    parser.add_argument("--split", choices=["test", "val"], default="test")
    args = parser.parse_args()

    evaluate_checkpoint(
        checkpoint_path=args.checkpoint,
        dataset_root=args.dataset_root,
        split=args.split,
    )
