"""
ML Module — PlantVillage Dataset
==================================
Loads images from a PlantVillage-style directory structure:

    data/raw/
        {CropName}___{DiseaseName}/
            image001.jpg
            ...

Features:
  - Auto-detects all classes from directory names
  - Stratified train/val/test split preserving class balance
  - Configurable augmentation pipeline (train vs eval)
  - Normalises class names to human-readable strings
  - Handles unsupported file extensions gracefully

IMPORTANT:
  This module never fabricates labels or images.
  If data/raw/ is empty or absent, a clear error is raised.
"""
from __future__ import annotations

import logging
import re
from pathlib import Path

import torch
from PIL import Image, UnidentifiedImageError
from torch.utils.data import DataLoader, Dataset, Subset
from torchvision import transforms

from ml.disease_classifier.config import MLConfig

logger = logging.getLogger(__name__)

# Supported image extensions
_VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp"}


# ── Label normalisation ────────────────────────────────────────────────────────

def normalise_class_name(raw_name: str) -> str:
    """
    Convert a PlantVillage directory name to a human-readable disease name.

    Examples:
        "Wheat___Leaf_Rust"           → "Wheat — Leaf Rust"
        "Tomato___Early_Blight"       → "Tomato — Early Blight"
        "Pepper,_bell___Bacterial_spot" → "Pepper Bell — Bacterial Spot"
    """
    # Strip leading/trailing whitespace
    name = raw_name.strip()
    # Replace triple underscore separator
    if "___" in name:
        parts = name.split("___", 1)
        crop = re.sub(r"[_,]+", " ", parts[0]).strip().title()
        disease = re.sub(r"_+", " ", parts[1]).strip().title()
        return f"{crop} — {disease}"
    # Fallback: replace underscores with spaces
    return re.sub(r"_+", " ", name).strip().title()


# ── Dataset class ─────────────────────────────────────────────────────────────

class PlantVillageDataset(Dataset):
    """
    ImageFolder-style dataset for PlantVillage or pre-split plant disease data.

    Unlike torchvision.ImageFolder this class:
      - Supports deterministic class index assignment via class_to_idx
      - Normalises class names to human-readable strings
      - Validates each image before adding it to the index
      - Provides class_names and class_to_idx properties for checkpoint storage
    """

    def __init__(
        self,
        root: Path,
        transform: transforms.Compose | None = None,
        class_to_idx: dict[str, int] | None = None,
        cache_in_memory: bool = False,
    ) -> None:
        self.root = Path(root)
        self.transform = transform
        self.samples: list[tuple[Path, int]] = []
        self.raw_class_dirs: list[str] = []
        self.class_names: list[str] = []
        self.class_to_idx: dict[str, int] = class_to_idx or {}
        self.cache_in_memory = cache_in_memory
        self.cached_images: list[tuple[Image.Image, int]] = []

        self._build_index()

    def _build_index(self) -> None:
        if not self.root.exists():
            raise FileNotFoundError(
                f"Dataset root not found: {self.root}\n"
                f"Place images in subdirectories under {self.root}.\n"
            )

        # Discover class directories (sorted for reproducibility)
        discovered_dirs = sorted(
            d for d in self.root.iterdir()
            if d.is_dir() and not d.name.startswith(".")
        )

        if not discovered_dirs:
            raise ValueError(
                f"No class subdirectories found in {self.root}. "
                "Each subdirectory should represent a disease class."
            )

        if not self.class_to_idx:
            # Build deterministic alphabetical mapping
            self.class_to_idx = {d.name: i for i, d in enumerate(discovered_dirs)}

        self.raw_class_dirs = [d.name for d in discovered_dirs if d.name in self.class_to_idx]
        
        # Sort class names according to class_to_idx integer values
        idx_to_name = {v: k for k, v in self.class_to_idx.items()}
        sorted_raw_names = [idx_to_name[i] for i in sorted(idx_to_name.keys())]
        self.class_names = [normalise_class_name(name) for name in sorted_raw_names]

        skipped = 0
        target_size = (256, 256)
        for class_dir in discovered_dirs:
            if class_dir.name not in self.class_to_idx:
                continue
            class_idx = self.class_to_idx[class_dir.name]

            for img_path in class_dir.iterdir():
                if img_path.suffix.lower() not in _VALID_EXTENSIONS:
                    continue
                try:
                    with Image.open(img_path) as img:
                        if self.cache_in_memory:
                            rgb_img = img.convert("RGB").resize(
                                target_size, Image.Resampling.BILINEAR
                            )
                            self.cached_images.append((rgb_img, class_idx))
                        else:
                            img.verify()
                    self.samples.append((img_path, class_idx))
                except (UnidentifiedImageError, OSError, SyntaxError, Exception):
                    logger.warning(f"Skipping corrupt image: {img_path}")
                    skipped += 1

        logger.info(
            f"Dataset loaded from {self.root.name}: {len(self.class_names)} classes, "
            f"{len(self.samples)} valid images, {skipped} skipped."
            + (" (Cached 256x256 in memory)" if self.cache_in_memory else "")
        )

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, int]:
        if self.cache_in_memory:
            image, label = self.cached_images[idx]
            if self.transform:
                image = self.transform(image)
            return image, label  # type: ignore[return-value]

        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, label  # type: ignore[return-value]


# ── Transform pipelines ───────────────────────────────────────────────────────

def get_train_transforms(image_size: int, config: MLConfig) -> transforms.Compose:
    """Augmented transform for training split."""
    tf_list: list = [
        transforms.Resize((image_size + 32, image_size + 32)),
        transforms.RandomCrop(image_size),
    ]
    if config.random_flip:
        tf_list.append(transforms.RandomHorizontalFlip())
        tf_list.append(transforms.RandomVerticalFlip(p=0.2))
    if config.random_rotation_deg > 0:
        tf_list.append(transforms.RandomRotation(config.random_rotation_deg))
    if config.color_jitter:
        tf_list.append(
            transforms.ColorJitter(
                brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05
            )
        )
    tf_list += [
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
    if config.random_erasing:
        tf_list.append(transforms.RandomErasing(p=0.2, scale=(0.02, 0.1)))
    return transforms.Compose(tf_list)


def get_eval_transforms(image_size: int) -> transforms.Compose:
    """Deterministic transform for validation/test/inference."""
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])


# ── Train / val / test split ──────────────────────────────────────────────────

def make_stratified_splits(
    dataset: PlantVillageDataset,
    config: MLConfig,
    seed: int = 42,
) -> tuple[Subset, Subset, Subset]:
    """
    Split dataset into train/val/test subsets with class balance.

    Returns (train_subset, val_subset, test_subset).
    """
    import random
    random.seed(seed)

    # Group sample indices by class
    class_indices: dict[int, list[int]] = {}
    for idx, (_, label) in enumerate(dataset.samples):
        class_indices.setdefault(label, []).append(idx)

    train_idx, val_idx, test_idx = [], [], []
    for label, indices in class_indices.items():
        random.shuffle(indices)
        n = len(indices)
        n_train = max(1, int(n * config.train_split))
        n_val = max(1, int(n * config.val_split))
        train_idx.extend(indices[:n_train])
        val_idx.extend(indices[n_train : n_train + n_val])
        test_idx.extend(indices[n_train + n_val :])

    logger.info(
        f"Split: train={len(train_idx)}, val={len(val_idx)}, test={len(test_idx)}"
    )
    return (
        Subset(dataset, train_idx),
        Subset(dataset, val_idx),
        Subset(dataset, test_idx),
    )


def make_dataloaders(
    train_subset: Subset,
    val_subset: Subset,
    test_subset: Subset,
    config: MLConfig,
) -> tuple[DataLoader, DataLoader, DataLoader]:
    """Build DataLoaders from split subsets."""
    # Apply correct transforms to each split
    base_dataset: PlantVillageDataset = train_subset.dataset  # type: ignore
    image_size = config.image_size

    train_subset.dataset = _TransformDataset(  # type: ignore
        base_dataset, get_train_transforms(image_size, config) if config.augment_train
        else get_eval_transforms(image_size)
    )

    val_loader = DataLoader(
        _RawSubset(val_subset, get_eval_transforms(image_size)),
        batch_size=config.batch_size,
        shuffle=False,
        num_workers=config.num_workers,
        pin_memory=config.pin_memory,
    )
    test_loader = DataLoader(
        _RawSubset(test_subset, get_eval_transforms(image_size)),
        batch_size=config.batch_size,
        shuffle=False,
        num_workers=config.num_workers,
        pin_memory=config.pin_memory,
    )
    train_loader = DataLoader(
        train_subset,
        batch_size=config.batch_size,
        shuffle=True,
        num_workers=config.num_workers,
        pin_memory=config.pin_memory,
    )
    return train_loader, val_loader, test_loader


class _RawSubset(Dataset):
    """Apply a transform to a Subset without modifying the underlying dataset."""

    def __init__(self, subset: Subset, transform: transforms.Compose) -> None:
        self.subset = subset
        self.transform = transform

    def __len__(self) -> int:
        return len(self.subset)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, int]:
        img_path, label = self.subset.dataset.samples[self.subset.indices[idx]]
        image = Image.open(img_path).convert("RGB")
        return self.transform(image), label  # type: ignore[return-value]


class _TransformDataset(Dataset):
    """Wrapper that applies a new transform to a PlantVillageDataset."""

    def __init__(self, dataset: PlantVillageDataset, transform: transforms.Compose) -> None:
        self._dataset = dataset
        self.transform = transform

    def __len__(self) -> int:
        return len(self._dataset)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, int]:
        img_path, label = self._dataset.samples[idx]
        image = Image.open(img_path).convert("RGB")
        return self.transform(image), label  # type: ignore[return-value]
