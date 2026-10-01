# CropDoctor Ai — Phase 2 ML Pipeline Guide

> **Backend-only document.** Frontend image upload UI is built in Phase 3.

---

## Overview

Phase 2 adds the complete disease diagnosis ML pipeline:

```
image upload → validation → EfficientNet-B0 → confidence gate → severity → Grad-CAM → response
```

The new endpoint is: **`POST /api/v1/analyze`**

---

## 1. Dataset Preparation

### Where to get PlantVillage data

PlantVillage is a publicly available benchmark dataset. You can obtain it from:

- **Official source**: https://data.mendeley.com/datasets/tywbtsjrjv/1 (Mendeley Data)
- **Kaggle mirror**: Search "Plant Village Dataset" on kaggle.com
- **PaddlePaddle mirror**: Available via PaddleClas examples

> [!IMPORTANT]
> CropDoctor Ai does NOT ship training images. You must download the dataset
> and place it yourself under `data/raw/`.

### Dataset directory structure

PlantVillage uses the naming convention `{CropName}___{DiseaseName}`.
Place images in subdirectories under `data/raw/`:

```
data/raw/
    Wheat___Leaf_Rust/
        image001.jpg
        image002.jpg
        ...
    Wheat___Yellow_Rust/
        ...
    Wheat___healthy/
        ...
    Tomato___Early_Blight/    ← other PlantVillage crops are ignored
        ...
```

The training script **auto-detects all class directories**.
Add more classes simply by adding more subdirectories — no code changes needed.

### Recommended demo subset (quick start)

For a hackathon demo, 4 crops × 4 classes × ~200 images each is sufficient.
Suggested classes:

| Directory name | Human-readable |
|---------------|----------------|
| `Wheat___Leaf_Rust` | Wheat — Leaf Rust |
| `Wheat___Yellow_Rust_(Stripe_Rust)` | Wheat — Yellow Rust |
| `Wheat___healthy` | Wheat — Healthy |
| `Cotton___Bacterial_Blight` | Cotton — Bacterial Blight |
| `Cotton___healthy` | Cotton — Healthy |
| `Rice___Blast` | Rice — Rice Blast |
| `Rice___Brown_Spot` | Rice — Brown Spot |
| `Rice___healthy` | Rice — Healthy |

> [!WARNING]
> PlantVillage images were collected in controlled lab conditions.
> Performance on Pakistani field photos may be **significantly lower**.
> Do not claim PlantVillage accuracy equals real-world Pakistani field performance.

---

## 2. Training the Model

```bash
# From the backend/ directory
cd backend

# Activate your virtual environment
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # Linux/Mac

# Train with defaults (reads dataset from ../data/raw/)
python -m ml.disease_classifier.train

# Custom options
python -m ml.disease_classifier.train \
    --dataset-root D:/plantvillage/data \
    --epochs 50 \
    --batch-size 16 \
    --lr 5e-5 \
    --checkpoint-dir ./ml/models \
    --device cuda
```

### What training produces

```
backend/ml/models/
    classifier.pt               ← Best checkpoint (weights + class names + metadata)
    classifier_classes.json     ← Class names list (for inspection)
    training_log.csv            ← Epoch-by-epoch loss/accuracy log
```

> [!NOTE]
> The checkpoint **bundles class names** so inference never diverges from training.
> Moving or renaming the checkpoint file is fine — just update `CLASSIFIER_CHECKPOINT`.

---

## 3. Evaluating the Model

```bash
cd backend

python -m ml.disease_classifier.evaluate \
    --checkpoint ml/models/classifier.pt \
    --dataset-root ../data/raw \
    --split test
```

Output:
- Top-1 and Top-5 accuracy on the test split
- Per-class accuracy table
- `confusion_matrix_test.csv` saved alongside the checkpoint

> [!CAUTION]
> Report evaluation metrics **honestly**.
> These numbers describe performance on PlantVillage test images only.
> They do NOT represent expected performance on Pakistani field images
> without separate field validation.

---

## 4. Placing the Checkpoint

After training:

```
backend/
    ml/
        models/
            classifier.pt           ← Must exist for real inference
            classifier_classes.json ← Auto-generated alongside checkpoint
```

Verify your `.env` points to it:

```env
CLASSIFIER_CHECKPOINT=./ml/models/classifier.pt
CLASSIFIER_CLASSES=./ml/models/classifier_classes.json
DIAGNOSIS_MOCK_MODE=false
```

---

## 5. Starting the FastAPI Server

```bash
cd backend

# Copy env template if not done yet
copy .env.example .env
# Edit .env — set your DashScope key and DIAGNOSIS_MOCK_MODE

# Start dev server
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs — the **`/api/v1/analyze`** endpoint appears in Swagger.

---

## 6. Testing `/api/v1/analyze`

### Quick curl test (mock mode)

```bash
curl -X POST http://localhost:8000/api/v1/analyze \
     -F "image=@path/to/leaf.jpg" \
     -F "crop=wheat"
```

### Expected mock response

```json
{
  "success": true,
  "diagnosis": {
    "disease": "Wheat — Leaf Rust [MOCK]",
    "confidence": 0.91,
    "uncertain": false,
    "top_predictions": [
      {"disease": "Wheat — Leaf Rust [MOCK]", "confidence": 0.91},
      {"disease": "Wheat — Yellow Rust [MOCK]", "confidence": 0.06},
      {"disease": "Wheat — Healthy [MOCK]", "confidence": 0.03}
    ],
    "is_mock": true
  },
  "severity": {
    "affected_percentage": 12.4,
    "tier": "low"
  },
  "explanation": {
    "gradcam_image": null
  },
  "escalate": false,
  "is_mock": true
}
```

> Note: `gradcam_image` is `null` in mock mode — the system never fabricates heatmaps.

### Real inference response (when checkpoint is loaded)

Same structure but:
- `is_mock: false`
- `diagnosis.disease` — actual predicted class name (no `[MOCK]` suffix)
- `explanation.gradcam_image` — `"data:image/jpeg;base64,..."` overlay image

---

## 7. Mock Mode Explained

| Setting | Behaviour |
|---------|-----------|
| `DIAGNOSIS_MOCK_MODE=true` | Deterministic mock predictions, labelled `[MOCK]`. Severity runs on real image. Grad-CAM is null. |
| `DIAGNOSIS_MOCK_MODE=false` + checkpoint present | Full real inference. Severity + Grad-CAM run on real image. |
| `DIAGNOSIS_MOCK_MODE=false` + checkpoint missing | `HTTP 503` with clear error message. Never silently mocks. |

---

## 8. Running Tests

```bash
cd backend

# Run Phase 2 tests only
pytest tests/test_analyze.py -v

# Run all tests
pytest tests/ -v

# Run lint checks
ruff check app/ ml/

# Type check (optional but recommended)
mypy app/ --ignore-missing-imports
```

All 11 tests in `test_analyze.py` should pass with `DIAGNOSIS_MOCK_MODE=true`.

---

## 9. Severity Estimator Notes

The severity estimator uses OpenCV HSV colour segmentation.

**This is a heuristic approach.** Thresholds:

| Tier | Affected leaf area |
|------|-------------------|
| healthy | < 5% |
| low | 5–25% |
| moderate | 25–50% |
| severe | ≥ 50% |

These thresholds are configurable via:
```env
SEVERITY_THRESHOLD_LOW=5.0
SEVERITY_THRESHOLD_MODERATE=25.0
SEVERITY_THRESHOLD_SEVERE=50.0
```

> [!WARNING]
> The severity estimator output has NOT been clinically or scientifically validated.
> Do NOT present it as a precise agronomic measurement.

---

## 10. Grad-CAM Notes

Grad-CAM uses the **last convolutional block** of EfficientNet-B0.

- Returned as a base64-encoded JPEG inline in the response
- Only generated when `DIAGNOSIS_MOCK_MODE=false` and a model is loaded
- In mock mode: `gradcam_image: null` — never fabricated

---

## Phase 3 Next Steps

- Frontend image upload UI (`/diagnose` page)
- Mobile camera capture support
- Weather + risk map integration
