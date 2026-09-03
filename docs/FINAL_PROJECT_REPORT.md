# AgriGuard AI — Comprehensive Final Project Report
### Explainable Crop Disease Intelligence & Proactive Risk Forecasting for Pakistan

---

## 1. Executive Summary

**AgriGuard AI** is an end-to-end, privacy-preserving agricultural disease intelligence platform engineered specifically for smallholder farmers and agricultural extension officers across Pakistan.

Agriculture accounts for over **22% of Pakistan's GDP** and employs more than **37% of the national labor force**. Fungal, viral, and bacterial crop epidemics—such as **Wheat Leaf Rust**, **Cotton Leaf Curl Virus (CLCuD)**, and **Rice Blast**—inflict billions of rupees in annual yield losses. Most existing mobile tools merely offer black-box image classification without context, severity measurement, or geographical risk forewarning.

**AgriGuard AI fundamentally changes this paradigm** by delivering:
1. **Explainable AI (Grad-CAM)**: Proves to the farmer *why* a disease was identified by highlighting visual lesion activations.
2. **Automated Severity Measurement (OpenCV)**: Quantifies the percentage of affected leaf surface area for objective triage.
3. **Proactive 7-Day Outbreak Forecasting (XGBoost + Open-Meteo)**: Integrates live micro-climate telemetry to forewarn farmers before epidemics spread.
4. **Multilingual Grounded Advisory (FAISS RAG + Qwen)**: Delivers contextual guidance in English, Urdu (اردو), and Sindhi (سنڌي).
5. **Strict Agronomic Safety & Geo-Privacy**: Refuses dangerous chemical dosage synthesis, escalates uncertain cases (<60%) to certified extension experts, and protects farmer field GPS coordinates.

---

## 2. Complete Phase-by-Phase Architecture

```
                                  AGRIGUARD AI PIPELINE
                                  
   +-----------------------------------------------------------------------------------+
   |                                 CLIENT INTERFACE                                  |
   |   Next.js 16 (PWA-Ready Mobile UX) · Anonymous device_id · Multilingual (EN/UR/SD)|
   +-----------------------------------------+-----------------------------------------+
                                             |
                   +-------------------------+-------------------------+
                   |                                                   |
                   v                                                   v
   +-------------------------------+                   +-------------------------------+
   |      COMPUTER VISION          |                   |     EPIDEMIOLOGICAL RISK      |
   | - EfficientNet-B0 (PyTorch)   |                   | - Open-Meteo 7-Day Forecast   |
   | - OpenCV Severity Heuristic   |                   | - XGBoost Outbreak Predictor  |
   | - Grad-CAM Visual Heatmaps    |                   | - District Centroid Privacy   |
   +---------------+---------------+                   +---------------+---------------+
                   |                                                   |
                   +-------------------------+-------------------------+
                                             |
                                             v
   +-----------------------------------------------------------------------------------+
   |                             MULTILINGUAL RAG ADVISOR                              |
   | - paraphrase-multilingual-MiniLM (384-dim) · FAISS CPU Vector Store               |
   | - Qwen LLM (Alibaba Cloud Model Studio) · Strict Chemical Dosage Guardrail        |
   +-----------------------------------------+-----------------------------------------+
                                             |
                                             v
   +-----------------------------------------------------------------------------------+
   |                          PERSISTENCE & DEPLOYMENT LAYER                           |
   | - SQLite / SQLAlchemy Async ORM · Device Isolation · /health & /ready Endpoints   |
   | - Docker Multi-Container Stack · Alibaba Cloud ECS / OSS / RDS Deployment Ready  |
   +-----------------------------------------------------------------------------------+
```

### Phase 1: Explainable Vision & Severity Pipeline
- **EfficientNet-B0 Backbone**: Compound coefficient scaled convolutional network trained on major Pakistani cash and staple crops (Cotton, Wheat, Rice, Sugarcane).
- **OpenCV Lesion Severity Estimation**: Color-space segmentation (HSV/Lab) calculating affected leaf surface percentage ($0.0\% \to 100.0\%$) and assigning standardized severity tiers (*Healthy*, *Low*, *Moderate*, *Severe*).
- **Grad-CAM Explainability**: Backpropagation gradients of the target class score mapped to the final convolutional feature maps, generating visual heat overlays that prove the model focused on real symptoms rather than background soil or finger noise.

### Phase 2: Meteorological Outbreak Forecasting
- **XGBoost Epidemiological Model**: Gradient-boosted decision trees trained on environmental disease triangles (temperature duration, relative humidity, precipitation, wind speed).
- **Live Open-Meteo Integration**: Fetches real-time 7-day meteorological forecasts for 30 major agricultural district centroids across Punjab, Sindh, KPK, and Balochistan.
- **Primary Driver Attribution**: Identifies the primary meteorological factor driving outbreak risk (e.g. *"High relative humidity (82%) with optimal sporulation temperature"*).

### Phase 3: Geospatial Risk Map & Geo-Privacy
- **Centroid-Based Risk Mapping**: District-level spatial aggregation of disease vulnerability and historical scan counts.
- **Haversine Geo-Privacy Layer**: Browser GPS coordinates are immediately snapped to the nearest public district centroid with spatial jitter; raw farmer GPS coordinates are **never stored** in databases or broadcast over public APIs.

### Phase 4: Grounded Multilingual RAG Advisor
- **Dense Vector Search**: `paraphrase-multilingual-MiniLM-L12-v2` dense 384-dimensional embeddings indexed in FAISS CPU.
- **Institutional Agronomic Knowledge**: Curated exclusively from verified publications (FAO, Central Cotton Research Institute Multan, and Provincial Agriculture Extension Departments).
- **Trilingual LLM Generation**: Qwen LLM synthesizing responses in English, Urdu (اردو), and Sindhi (سنڌي).
- **Chemical Dosage Refusal Guardrail**: Explicit regex & semantic safety filter refusing to synthesize synthetic chemical volumes (e.g. ml/acre) to prevent phytotoxicity and chemical resistance.

### Phase 5: Anonymous Device-Level History Isolation
- **Frictionless Anonymous Onboarding**: Farmers do not need accounts, passwords, or emails. An anonymous UUID `device_id` is generated and persisted in client `localStorage`.
- **Database Isolation**: Historical diagnosis records are strictly queried and filtered by `device_id` via SQLAlchemy 2.x async ORM, preventing data leakage between devices while preserving legacy database records.

### Phase 6: Mobile-First UX & Interactive Tools
- **Complete Suite of Functional Web Applications**:
  - **Scanner (`/diagnose`)**: Multi-stage loading feedback, camera capture (`capture="environment"`), gallery upload, and 10MB payload validation.
  - **Ordered Results (`/results`)**: Ordered layout (Diagnosis $\to$ Severity $\to$ Grad-CAM $\to$ District Risk Context $\to$ Multilingual Advisor $\to$ Expert Escalation).
  - **Interactive Risk Map (`/risk-map` & `/map`)**: Crop filters, severity badges, and district risk popups.
  - **AI Advisor (`/advisor` & `/chat`)**: Conversational RAG with diagnosis context carry-over and source citations.
  - **Farmer Dashboard (`/dashboard`)**: Personal historical scan list, statistics, and weather risk forecast.
  - **Expert Consultation (`/expert`)**: Official extension toll-free helpline (`0800-15000`) and WhatsApp routing.

### Phase 7: Production Hardening & Cloud Architecture
- **Active Health & Readiness Endpoints**:
  - `GET /health` & `GET /api/v1/health`: Basic service metadata and mode flags.
  - `GET /ready` & `GET /api/v1/ready`: Actively verifies database connection (`SELECT 1`), vision model readiness, district centroids, and FAISS index.
- **Production Logging & Error Sanitization**: Structured timestamped logging with `LOG_LEVEL` configuration; unhandled 500 exceptions sanitized in production mode.
- **Docker Containerization**: Lean `docker/backend.Dockerfile` and multi-stage `docker/frontend.Dockerfile` with Docker Compose orchestration.
- **Alibaba Cloud Architecture Blueprint**: Complete documentation for provisioning ECS, OSS object storage, Model Studio DashScope Qwen API, and ApsaraDB RDS PostgreSQL.

### Phase 8: Information Architecture & QA Verification
- **New Informational Pages**:
  - **About (`/about`)**: Pakistan agricultural context, smallholder challenges, and project mission.
  - **How It Works (`/how-it-works`)**: Visual step-by-step breakdown of the 6-stage intelligence pipeline.
  - **Technology (`/technology`)**: Deep-dive technical specifications of all ML models and architectures.
  - **Safety & Responsible AI (`/safety`)**: Governance charter detailing chemical dosage refusal, low-confidence escalation, and privacy.
  - **Demo Guide (`/demo`)**: Hackathon judge evaluation companion with verified test cases and 3-minute pitch script.
- **Unified Navigation**: Enhanced `Navbar.tsx` and rich 4-column `Footer.tsx` interconnecting all decision tools, technical specs, and safety guidelines.

---

## 3. Comprehensive Verification & Test Summary

| Test Suite | Scope | Target | Result | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Backend Pytest** | Analyze, Chat, Diagnosis, Health/Ready, Map, Privacy, RAG, Weather | 58 Tests | **58 / 58 Passed** | **PASS** |
| **Backend Ruff** | Python linting & formatting across `app/` and `ml/` | 0 Errors | **0 Errors** | **PASS** |
| **Frontend Test Suite** | Contracts, schemas, dosage guardrails, translations, UX | 15 Tests | **15 / 15 Passed** | **PASS** |
| **Frontend ESLint** | TypeScript & React linting across `app/`, `components/`, `lib/` | 0 Errors | **0 Errors** | **PASS** |
| **Next.js Production Build** | Static page pre-rendering & TypeScript compilation | 17 Routes | **17 / 17 Routes Pre-rendered** | **PASS** |

---

## 4. Responsible AI & Safety Highlights

1. **Zero Chemical Dosage Prescription**: AgriGuard strictly refuses to synthesize specific pesticide formulas or volumes, avoiding the risks of crop phytotoxicity, chemical resistance, and groundwater contamination.
2. **Human-in-the-Loop Safety Gate**: Scans with confidence $<60\%$ or marked `uncertain=True` trigger amber advisory alerts and direct one-click escalation to certified agricultural extension officers.
3. **Geo-Privacy Centroid Protection**: Farmer private GPS coordinates are never stored on disk or broadcast over public APIs; map markers display only district centroid aggregations.
4. **Anonymous Device Isolation**: Farmers are protected by client-side UUID persistence without collecting personal identity records or passwords.
5. **Grounded Institutional Knowledge**: RAG knowledge is strictly cited from FAO, CCRI Multan, and Provincial Agriculture Departments.

---

## 5. Deployment Status

- **Local Production Readiness: VERIFIED.**
- **Alibaba Cloud Deployment: BLOCKED BY HACKATHON ACCESS — NOT YET AVAILABLE.**
- **Deployment Status: Deployment-ready; pending organizer-provided Alibaba Cloud access.**
- Full provisioning blueprints and container configurations are documented in [`docs/deployment.md`](deployment.md) and [`DEPLOYMENT.md`](../DEPLOYMENT.md).

---

## 6. Live Local Access Information

Both backend and frontend services are active and running:

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Probing**: [http://localhost:8000/health](http://localhost:8000/health)
- **Readiness Probing**: [http://localhost:8000/ready](http://localhost:8000/ready)

---

## 7. Key Project Documentation Index

- **Demo Walkthrough Script (3–5 Min)**: [`docs/DEMO_SCRIPT.md`](DEMO_SCRIPT.md)
- **Judge Technical Q&A (18 Questions)**: [`docs/JUDGE_QA.md`](JUDGE_QA.md)
- **Phase 8 Verification Report**: [`docs/PHASE8_FINAL_VERIFICATION_REPORT.md`](PHASE8_FINAL_VERIFICATION_REPORT.md)
- **Alibaba Cloud Deployment Blueprint**: [`docs/deployment.md`](deployment.md)
- **Master Final Project Report**: [`docs/FINAL_PROJECT_REPORT.md`](FINAL_PROJECT_REPORT.md)
