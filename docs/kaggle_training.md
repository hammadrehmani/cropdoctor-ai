# Kaggle GPU Training Workflow

This document provides a complete, copy-paste Kaggle Notebook workflow to train the **EfficientNet-B0** disease classifier on Kaggle's free GPU (T4/P100) environment.

---

## 1. Overview & Requirements

- **Model Architecture**: `EfficientNet-B0` with pretrained ImageNet weights.
- **Head**: `Dropout(p=0.3) -> Linear(1280, 3)`.
- **Target Classes**: 
  - `0`: `Healthy`
  - `1`: `Powdery`
  - `2`: `Rust`
- **Dataset Structure**: Pre-split dataset (`Train/`, `Validation/`, `Test/`).
  - `Train/`: 1,322 images (Healthy: 458, Powdery: 430, Rust: 434)
  - `Validation/`: 60 images (Healthy: 20, Powdery: 20, Rust: 20)
  - `Test/`: 150 images (Healthy: 50, Powdery: 50, Rust: 50)
- **Primary Metrics**: Top-1 Accuracy, Macro/Weighted F1-score, Precision, Recall.
- **Output Artifacts**:
  - `classifier.pt` (Full model checkpoint with state dict and metadata)
  - `classifier_classes.json` (`["Healthy", "Powdery", "Rust"]`)
  - `training_log.csv` (Epoch-by-epoch training and validation loss/accuracy)
  - `confusion_matrix_test.csv` (Test set confusion matrix)
  - `classification_report.txt` (Full scikit-learn test evaluation report)

---

## 2. Kaggle Notebook Copy-Paste Code

Create a new Kaggle Notebook, set **Accelerator** to **GPU T4 x2** or **P100**, and copy the code blocks below into sequential notebook cells.

### Cell 1: Environment Setup & Automatic Dataset Detection

```python
import os
import sys
import time
import json
import logging
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
import torchvision
from torchvision import transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from PIL import Image
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("KaggleTrainer")

# Auto-detect dataset root on Kaggle
KAGGLE_INPUT_DIR = Path("/kaggle/input")
DATASET_ROOT = None

# Strategy 1: Check known dataset slug
known_path = KAGGLE_INPUT_DIR / "plant-disease-recognition-dataset"
if known_path.exists():
    DATASET_ROOT = known_path

# Strategy 2: Recursive search
if DATASET_ROOT is None and KAGGLE_INPUT_DIR.exists():
    for p in KAGGLE_INPUT_DIR.glob("**/*"):
        if p.is_dir() and (p / "Train").exists() and (p / "Validation").exists() and (p / "Test").exists():
            DATASET_ROOT = p
            break

if DATASET_ROOT is None:
    raise FileNotFoundError(
        "Could not detect dataset. Attach plant-disease-recognition-dataset to notebook."
    )

# Handle doubled directory structure: Train/Train/Healthy/ vs Train/Healthy/
def resolve_split_dir(root, split_name):
    direct = root / split_name
    if (direct / "Healthy").is_dir():
        return direct
    doubled = direct / split_name
    if doubled.is_dir() and (doubled / "Healthy").is_dir():
        return doubled
    for child in direct.iterdir():
        if child.is_dir() and (child / "Healthy").is_dir():
            return child
    raise FileNotFoundError(f"Cannot find class dirs under {direct}")

SPLIT_DIRS = {
    "Train": resolve_split_dir(DATASET_ROOT, "Train"),
    "Validation": resolve_split_dir(DATASET_ROOT, "Validation"),
    "Test": resolve_split_dir(DATASET_ROOT, "Test"),
}

logger.info(f"Dataset root: {DATASET_ROOT}")
for sname, sdir in SPLIT_DIRS.items():
    logger.info(f"  {sname}: {sdir}")
```

### Cell 2: Hyperparameters & Configuration

```python
# Configuration parameters matching backend/ml/disease_classifier/config.py
CONFIG = {
    "num_classes": 3,
    "class_names": ["Healthy", "Powdery", "Rust"],
    "class_to_idx": {"Healthy": 0, "Powdery": 1, "Rust": 2},
    "image_size": 224,
    "crop_size": 224,
    "batch_size": 32,
    "epochs": 20,
    "learning_rate": 0.0001,
    "weight_decay": 0.01,
    "dropout": 0.3,
    "label_smoothing": 0.1,
    "seed": 42,
    "num_workers": 2,
    "pin_memory": True,
    "output_dir": Path("/kaggle/working"),
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225],
}

# Set seed for reproducibility
torch.manual_seed(CONFIG["seed"])
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(CONFIG["seed"])

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using compute device: {device}")
if device.type == "cuda":
    logger.info(f"GPU Model: {torch.cuda.get_device_name(0)}")
```

### Cell 3: Dataset Loader & Image Transforms

```python
def get_train_transforms(image_size: int):
    return transforms.Compose([
        transforms.Resize((image_size + 32, image_size + 32)),
        transforms.RandomCrop(image_size),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05),
        transforms.ToTensor(),
        transforms.Normalize(mean=CONFIG["mean"], std=CONFIG["std"]),
    ])

def get_eval_transforms(image_size: int):
    return transforms.Compose([
        transforms.Resize((image_size + 32, image_size + 32)),
        transforms.CenterCrop(image_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=CONFIG["mean"], std=CONFIG["std"]),
    ])

class PlantDiseaseKaggleDataset(Dataset):
    def __init__(self, root: Path, transform=None, class_to_idx=None):
        self.root = Path(root)
        self.transform = transform
        self.class_to_idx = class_to_idx or {"Healthy": 0, "Powdery": 1, "Rust": 2}
        self.samples = []
        
        valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
        for class_name, class_idx in self.class_to_idx.items():
            class_dir = self.root / class_name
            if not class_dir.exists():
                continue
            for img_path in class_dir.iterdir():
                if img_path.suffix.lower() in valid_exts:
                    self.samples.append((img_path, class_idx))
                    
    def __len__(self):
        return len(self.samples)
        
    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        with Image.open(img_path) as img:
            img = img.convert("RGB")
            if self.transform:
                img = self.transform(img)
        return img, label

train_dataset = PlantDiseaseKaggleDataset(SPLIT_DIRS["Train"], transform=get_train_transforms(CONFIG["image_size"]), class_to_idx=CONFIG["class_to_idx"])
val_dataset = PlantDiseaseKaggleDataset(SPLIT_DIRS["Validation"], transform=get_eval_transforms(CONFIG["image_size"]), class_to_idx=CONFIG["class_to_idx"])
test_dataset = PlantDiseaseKaggleDataset(SPLIT_DIRS["Test"], transform=get_eval_transforms(CONFIG["image_size"]), class_to_idx=CONFIG["class_to_idx"])

logger.info(f"Train samples: {len(train_dataset)}")
logger.info(f"Validation samples: {len(val_dataset)}")
logger.info(f"Test samples: {len(test_dataset)}")

train_loader = DataLoader(train_dataset, batch_size=CONFIG["batch_size"], shuffle=True, num_workers=CONFIG["num_workers"], pin_memory=CONFIG["pin_memory"])
val_loader = DataLoader(val_dataset, batch_size=CONFIG["batch_size"], shuffle=False, num_workers=CONFIG["num_workers"], pin_memory=CONFIG["pin_memory"])
test_loader = DataLoader(test_dataset, batch_size=CONFIG["batch_size"], shuffle=False, num_workers=CONFIG["num_workers"], pin_memory=CONFIG["pin_memory"])
```

### Cell 4: Model Factory & Optimizer Setup

```python
def build_efficientnet(num_classes: int = 3, dropout: float = 0.3):
    weights = EfficientNet_B0_Weights.DEFAULT
    model = efficientnet_b0(weights=weights)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=dropout, inplace=True),
        nn.Linear(in_features, num_classes),
    )
    return model

model = build_efficientnet(num_classes=CONFIG["num_classes"], dropout=CONFIG["dropout"]).to(device)

criterion = nn.CrossEntropyLoss(label_smoothing=CONFIG["label_smoothing"])
optimizer = AdamW(model.parameters(), lr=CONFIG["learning_rate"], weight_decay=CONFIG["weight_decay"])
scheduler = CosineAnnealingLR(optimizer, T_max=CONFIG["epochs"], eta_min=1e-6)
scaler = torch.amp.GradScaler("cuda", enabled=(device.type == "cuda"))
```

### Cell 5: Training & Validation Loop with AMP

```python
best_val_acc = 0.0
best_val_loss = float("inf")
best_checkpoint_payload = None
history = []

logger.info("Starting EfficientNet-B0 training on Kaggle GPU...")

for epoch in range(1, CONFIG["epochs"] + 1):
    t0 = time.time()
    
    # --- Train ---
    model.train()
    train_loss, train_correct, train_total = 0.0, 0, 0
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        
        with torch.amp.autocast("cuda", enabled=(device.type == "cuda")):
            outputs = model(images)
            loss = criterion(outputs, labels)
            
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
        
        train_loss += loss.item() * images.size(0)
        preds = outputs.argmax(dim=1)
        train_correct += (preds == labels).sum().item()
        train_total += images.size(0)
        
    avg_train_loss = train_loss / train_total
    avg_train_acc = train_correct / train_total
    
    # --- Validate ---
    model.eval()
    val_loss, val_correct, val_total = 0.0, 0, 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            with torch.amp.autocast("cuda", enabled=(device.type == "cuda")):
                outputs = model(images)
                loss = criterion(outputs, labels)
            val_loss += loss.item() * images.size(0)
            preds = outputs.argmax(dim=1)
            val_correct += (preds == labels).sum().item()
            val_total += images.size(0)
            
    avg_val_loss = val_loss / val_total
    avg_val_acc = val_correct / val_total
    scheduler.step()
    elapsed = time.time() - t0
    
    logger.info(
        f"Epoch {epoch:02d}/{CONFIG['epochs']} | "
        f"Train Loss: {avg_train_loss:.4f} Acc: {avg_train_acc:.4f} | "
        f"Val Loss: {avg_val_loss:.4f} Acc: {avg_val_acc:.4f} | "
        f"Time: {elapsed:.1f}s"
    )
    
    history.append({
        "epoch": epoch,
        "train_loss": avg_train_loss,
        "train_acc": avg_train_acc,
        "val_loss": avg_val_loss,
        "val_acc": avg_val_acc,
        "lr": scheduler.get_last_lr()[0],
    })
    
    # Checkpoint logic (save best by validation accuracy)
    if avg_val_acc > best_val_acc or (avg_val_acc == best_val_acc and avg_val_loss < best_val_loss):
        best_val_acc = avg_val_acc
        best_val_loss = avg_val_loss
        best_checkpoint_payload = {
            "state_dict": model.state_dict(),
            "model_state_dict": model.state_dict(),
            "class_names": CONFIG["class_names"],
            "num_classes": CONFIG["num_classes"],
            "image_size": CONFIG["image_size"],
            "normalization": {"mean": CONFIG["mean"], "std": CONFIG["std"]},
            "model_architecture": "efficientnet_b0",
            "training_config": CONFIG,
            "epoch": epoch,
            "val_acc": avg_val_acc,
            "val_loss": avg_val_loss,
            "best_val_accuracy": avg_val_acc,
            "seed": CONFIG["seed"],
        }

# Save checkpoint PT file
pt_path = CONFIG["output_dir"] / "classifier.pt"
torch.save(best_checkpoint_payload, pt_path)
logger.info(f"Saved best checkpoint to {pt_path} (Val Acc: {best_val_acc:.4f})")

# Save class names JSON file
json_path = CONFIG["output_dir"] / "classifier_classes.json"
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(CONFIG["class_names"], f, indent=2)
logger.info(f"Saved class names to {json_path}")

# Save training history CSV
df_history = pd.DataFrame(history)
df_history.to_csv(CONFIG["output_dir"] / "training_log.csv", index=False)
```

### Cell 6: Test Set Evaluation & Metrics Export

```python
logger.info("Evaluating best checkpoint ONCE on Test set (150 images)...")

# Load best checkpoint weights
best_model = build_efficientnet(num_classes=CONFIG["num_classes"], dropout=CONFIG["dropout"]).to(device)
checkpoint = torch.load(pt_path, map_location=device, weights_only=False)
best_model.load_state_dict(checkpoint["state_dict"])
best_model.eval()

all_preds = []
all_labels = []

with torch.no_grad():
    for images, labels in test_loader:
        images = images.to(device)
        outputs = best_model(images)
        preds = outputs.argmax(dim=1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.numpy())

all_preds = np.array(all_preds)
all_labels = np.array(all_labels)

# Metrics calculation
accuracy = (all_preds == all_labels).mean()
macro_prec, macro_rec, macro_f1, _ = precision_recall_fscore_support(all_labels, all_preds, average="macro")
weight_prec, weight_rec, weight_f1, _ = precision_recall_fscore_support(all_labels, all_preds, average="weighted")

cm = confusion_matrix(all_labels, all_preds)
report_str = classification_report(all_labels, all_preds, target_names=CONFIG["class_names"], digits=4)

print("\n" + "=" * 65)
print("PLANT-DISEASE DATASET TEST-SET PERFORMANCE EVALUATION")
print("=" * 65)
print(f"Top-1 Accuracy     : {accuracy:.4f} ({accuracy*100:.2f}%)")
print(f"Macro Precision    : {macro_prec:.4f}")
print(f"Macro Recall       : {macro_rec:.4f}")
print(f"Macro F1-Score     : {macro_f1:.4f}")
print(f"Weighted F1-Score  : {weight_f1:.4f}")
print("\nClassification Report:")
print(report_str)

# Save confusion matrix CSV
df_cm = pd.DataFrame(cm, index=CONFIG["class_names"], columns=CONFIG["class_names"])
df_cm.to_csv(CONFIG["output_dir"] / "confusion_matrix_test.csv")

# Save classification report TXT
with open(CONFIG["output_dir"] / "classification_report.txt", "w", encoding="utf-8") as f:
    f.write("Plant-Disease dataset test-set performance\n")
    f.write(f"Top-1 Accuracy: {accuracy:.4f}\n")
    f.write(f"Macro F1-Score: {macro_f1:.4f}\n\n")
    f.write(report_str)
```

### Cell 7: Checkpoint Compatibility Verification

```python
# Verify payload format matches backend/ml/disease_classifier/model.py load_checkpoint contract
check_ckpt = torch.load(pt_path, map_location="cpu", weights_only=False)
required_keys = {"state_dict", "class_names", "num_classes"}
missing_keys = required_keys - check_ckpt.keys()

assert len(missing_keys) == 0, f"Missing required keys in checkpoint: {missing_keys}"
assert check_ckpt["class_names"] == ["Healthy", "Powdery", "Rust"], f"Invalid class names: {check_ckpt['class_names']}"
assert check_ckpt["num_classes"] == 3, f"Invalid class count: {check_ckpt['num_classes']}"

print("\nCHECKPOINT VALIDATION: SUCCESS")
print("Verified compatibility with FastAPI InferenceEngine.")
```

---

## 3. Dataset Disclaimer

> [!WARNING]
> **Field Performance Disclaimer**: Test set accuracy evaluated on the `plant_disease` dataset reflects performance on curated benchmark images. It does **NOT** represent real-world Pakistani field performance without local dataset fine-tuning and domain adaptation.

---

## 4. Downloading Artifacts & Local Deployment

After running the Kaggle Notebook, download the generated output files:

1. In the Kaggle Notebook UI, expand the right-hand **Output** section under `/kaggle/working/`.
2. Download the two core model files:
   - `classifier.pt`
   - `classifier_classes.json`
3. Move the downloaded files to your local repository directory:
   ```text
   backend/ml/models/classifier.pt
   backend/ml/models/classifier_classes.json
   ```

### Verification Command

Once the files are placed locally, verify that the real model inference pipeline loads cleanly without starting training:

```bash
# Set mock mode to false and test real checkpoint loading
cmd /c "set DIAGNOSIS_MOCK_MODE=false && C:\Users\hamma\AppData\Local\Python\pythoncore-3.14-64\python.exe -c \"from app.config import settings; from ml.disease_classifier.inference import InferenceEngine; engine = InferenceEngine(settings, mock_mode=False); engine.load(); print('Loaded successfully:', engine.is_loaded)\""
```
