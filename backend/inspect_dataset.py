"""
Dataset Inspection Script for data/raw/plant_disease/
================================---------------------
Inspects train, validation, and test splits.
Checks image counts, image dimensions, corrupt/unreadable files.
"""
import os
from pathlib import Path
from PIL import Image

DATASET_ROOT = Path("D:/cropdoctor-ai/data/raw/plant_disease")

def inspect():
    print("=" * 70)
    print("DATASET INSPECTION REPORT")
    print("=" * 70)
    print(f"Dataset root: {DATASET_ROOT.resolve()}")

    if not DATASET_ROOT.exists():
        print(f"ERROR: Dataset root {DATASET_ROOT} does not exist!")
        return

    splits = ["Train", "Validation", "Test"]
    classes = ["Healthy", "Powdery", "Rust"]

    counts = {split: {cls: 0 for cls in classes} for split in splits}
    corrupt_files = []
    dimensions = []

    for split in splits:
        split_dir = DATASET_ROOT / split
        if not split_dir.exists():
            print(f"WARNING: Split directory {split_dir} missing!")
            continue

        for cls in classes:
            cls_dir = split_dir / cls
            if not cls_dir.exists():
                print(f"WARNING: Class directory {cls_dir} missing!")
                continue

            for root, _, files in os.walk(cls_dir):
                for f in files:
                    file_path = Path(root) / f
                    # Skip non-image files if any
                    if f.startswith(".") or f.endswith(".txt") or f.endswith(".json") or f.endswith(".md"):
                        continue

                    counts[split][cls] += 1

                    try:
                        with Image.open(file_path) as img:
                            img.verify()  # Verify CRC and headers
                        # Re-open to get format and size (verify closes img)
                        with Image.open(file_path) as img:
                            dimensions.append(img.size) # (width, height)
                    except Exception as e:
                        corrupt_files.append((str(file_path), str(e)))

    print("\n--- 1. IMAGE COUNTS PER SPLIT & CLASS ---")
    for split in splits:
        print(f"\n{split.upper()} SPLIT:")
        for cls in classes:
            print(f"  {split}/{cls:<10}: {counts[split][cls]} images")
        split_total = sum(counts[split].values())
        print(f"  --> Total {split}: {split_total}")

    total_all = sum(sum(counts[s].values()) for s in splits)
    print(f"\nTOTAL ALL IMAGES: {total_all}")

    print("\n--- 2. CORRUPT / UNREADABLE IMAGES ---")
    print(f"Total corrupt/unreadable images found: {len(corrupt_files)}")
    if corrupt_files:
        for path, err in corrupt_files:
            print(f"  - {path}: {err}")
    else:
        print("  - None! All images read successfully by PIL.")

    print("\n--- 3. IMAGE DIMENSION STATISTICS ---")
    if dimensions:
        widths = [d[0] for d in dimensions]
        heights = [d[1] for d in dimensions]
        min_w, max_w, avg_w = min(widths), max(widths), sum(widths) / len(widths)
        min_h, max_h, avg_h = min(heights), max(heights), sum(heights) / len(heights)

        # Check unique dimension pairs
        unique_dims = set(dimensions)
        print(f"Widths  : Min = {min_w}px, Max = {max_w}px, Avg = {avg_w:.1f}px")
        print(f"Heights : Min = {min_h}px, Max = {max_h}px, Avg = {avg_h:.1f}px")
        print(f"Unique image dimensions (W x H): {len(unique_dims)}")
        for dim in list(unique_dims)[:10]:
            print(f"  - {dim[0]} x {dim[1]} (count: {dimensions.count(dim)})")
        if len(unique_dims) > 10:
            print(f"  ... and {len(unique_dims) - 10} more unique sizes")
    else:
        print("No images found to compute dimensions.")

    print("=" * 70)

if __name__ == "__main__":
    inspect()
