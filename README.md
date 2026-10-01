# 🌾 CropDoctor AI

**AI-Powered Plant Disease & Pest Identification System for Smart Farming**

Real-Time Deep Learning Vision · Grad-CAM Visual Explainability · Automated OpenCV Severity Analysis · Multilingual AI Agronomist (English, اردو, سنڌي) · 7-Day Meteorological Outbreak Forecasting · Zero-GPS Farmer Privacy Protection.

---

## 🎯 Target Crops & Diagnostic Scope

| Crop | Verified Classes (EfficientNet-B0) | Target Field Diseases |
|------|-----------------------------------|-----------------------|
| **Wheat** | Healthy, Powdery Mildew, Leaf Rust | Leaf Rust, Yellow Rust |
| **Cotton** | Under Development / Multi-Crop Pipeline | Bacterial Blight, CLCuD |
| **Rice** | Under Development / Multi-Crop Pipeline | Blast, Brown Spot |
| **Sugarcane** | Under Development / Multi-Crop Pipeline | Red Rot, Smut |

> [!IMPORTANT]
> **Real-World ML Disclaimer:** The EfficientNet-B0 classifier achieved a 98% test-set accuracy on the Kaggle Plant-Disease benchmark split (`Healthy`, `Powdery`, `Rust`). This benchmark result is informational and does NOT guarantee identical accuracy in real Pakistani field conditions where varying lighting, mixed infections, leaf occlusions, and dust occur. All diagnoses should be validated alongside agronomic field inspection.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS |
| **Backend API** | FastAPI, Uvicorn, SQLAlchemy 2.0 (Async), Pydantic v2 |
| **Vision & ML** | PyTorch, torchvision (EfficientNet-B0), PyTorch Grad-CAM, OpenCV |
| **Micro-Climate** | Open-Meteo API (7-day forecast & micro-risk engine) |
| **AI Advisor (RAG)** | DashScope / Qwen-Turbo LLM, FAISS Vector Index, multilingual prompts (EN/UR/SD) |
| **Database** | SQLite + aiosqlite (Development) / PostgreSQL + asyncpg (Production) |

---

## 🚀 Quick Start & Setup

### 1. Repository Setup

```bash
git clone https://github.com/hammadrehmani/cropdoctor-ai
cd cropdoctor-ai
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env to verify:
# DIAGNOSIS_MOCK_MODE=false
# CLASSIFIER_CHECKPOINT=./ml/models/classifier.pt
# CLASSIFIER_CLASSES=./ml/models/classifier_classes.json
# (Optional) DASHSCOPE_API_KEY=your-api-key-here

# Run backend API server
python -m uvicorn app.main:app --port 8000 --reload
```

Backend API Swagger Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env.local

# Run frontend dev server
npm run dev
```

Application interface: `http://localhost:3000`

---

## 🧠 ML Model Checkpoints & Training Data

- **Model Checkpoint**: Place `classifier.pt` at `backend/ml/models/classifier.pt`
- **Class Labels**: Place `classifier_classes.json` at `backend/ml/models/classifier_classes.json` (`["Healthy", "Powdery", "Rust"]`)
- **Dataset Root**: Test and training data placed in `data/raw/plant_disease/`

---

## 🧪 Testing & Verification

### Backend Tests & Linting
```bash
cd backend
python -m pytest tests/ -v
python -m ruff check app/ ml/
```

### Frontend Tests, Lint & Production Build
```bash
cd frontend
npm test
npm run lint
npm run build
```

---

## 🔒 Privacy & Security Safeguards

- **Zero Raw GPS Storage**: Raw farmer GPS coordinates (`lat`, `lon`, `latitude`, `longitude`, `gps`) are **never persisted in database records** and **never returned via API**. Raw coordinates are converted server-side into district names (e.g., `Faisalabad`) before storage.
- **Lightweight History**: Base64 Grad-CAM images and raw uploaded images are not stored in database history, keeping API responses sub-millisecond and lightweight.
- **Safe Advisor Mode**: When `ADVISOR_MOCK_MODE=false` and `DASHSCOPE_API_KEY` is not provided, the advisor safely returns `HTTP 503` rather than hallucinating or returning fabricated mock responses.

---

## 📜 Development Status

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | System Scaffolding, Schemas & Health Check | ✅ Complete & Verified |
| **Phase 2–4** | Real EfficientNet-B0 Inference & OpenCV Severity | ✅ Complete & Verified |
| **Phase 5** | Mobile-First UI & Real `/api/v1/analyze` Integration | ✅ Complete & Verified |
| **Phase 6/6A** | Multilingual AI Advisor & Safe Provider Fallback | ✅ Complete & Verified |
| **Phase 7** | Farmer Dashboard & Diagnosis History Persistence | ✅ Complete & Verified |
| **Phase 7A** | 7-Day Weather & Disease Risk Micro-Forecast | ✅ Complete & Verified |
| **Phase 8** | Production Hardening, Security Audit & E2E Verification | ✅ Complete & Verified |

---

## 📄 License

MIT License — CropDoctor AI Project.
