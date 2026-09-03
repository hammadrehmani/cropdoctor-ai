# AgriGuard AI — Deployment & Production Operations Guide

## Executive Deployment Status

> **Alibaba Cloud deployment: BLOCKED BY HACKATHON ACCESS — NOT YET AVAILABLE.**  
> **Local production readiness: VERIFIED.**  
> **Status:** Deployment-ready; pending organizer-provided Alibaba Cloud access.

---

## 1. Architecture Overview on Alibaba Cloud

```
                                  ┌──────────────────────────────────────────────┐
                                  │           Alibaba Cloud Route 53 / DNS       │
                                  └──────────────────────┬───────────────────────┘
                                                         │ HTTPS (443)
                                                         ▼
                                  ┌──────────────────────────────────────────────┐
                                  │       Alibaba Cloud SLB / Nginx Reverse Proxy │
                                  └──────────┬────────────────────────┬──────────┘
                                             │                        │
                     / (Frontend SSR)        ▼                        ▼ /api/v1 (Backend)
                                  ┌──────────────────────┐ ┌──────────────────────┐
                                  │   Alibaba Cloud ECS  │ │   Alibaba Cloud ECS  │
                                  │   Next.js Frontend   │ │   FastAPI Backend    │
                                  │   (Node 20 Container)│ │   (Python 3.11 Env)  │
                                  └──────────────────────┘ └──────────┬───────────┘
                                                                      │
                                                ┌─────────────────────┼─────────────────────┐
                                                ▼                     ▼                     ▼
                                     ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
                                     │ Alibaba Cloud    │  │ Alibaba Cloud    │  │ Model Studio     │
                                     │ OSS (Buckets)    │  │ ApsaraDB RDS     │  │ DashScope        │
                                     │ Grad-CAM Images  │  │ (PostgreSQL/GIS) │  │ Qwen LLM API     │
                                     └──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Components:
1. **Compute (ECS / ACK)**:
   - Frontend Next.js running on Container Service / ECS instance (`ecs.c7.large`).
   - Backend FastAPI running with Uvicorn ASGI workers on GPU/CPU optimized instance (`ecs.gn7i-vinstance.2xlarge` or `ecs.g7.xlarge`).
2. **Object Storage (OSS)**:
   - Grad-CAM visual heatmaps and uploaded leaf imagery persisted to Alibaba Cloud OSS bucket (`agriguard-assets`).
3. **Database (ApsaraDB RDS for PostgreSQL)**:
   - Scalable relational database with PostGIS extensions for district-level risk mapping and anonymous device isolation.
4. **AI / Model Inference (Model Studio & DashScope)**:
   - Grounded Qwen-Turbo / Qwen-Plus model accessed via DashScope International Gateway (`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`).

---

## 2. Local Production Readiness & Verification

AgriGuard AI is fully verified for local production execution.

### Prerequisites:
- Python 3.10+ (tested with Python 3.11 / 3.14)
- Node.js 18+ (tested with Node.js 20+)
- Docker & Docker Compose (optional containerized run)

### Method A: Native Local Production Startup

#### 1. Backend Setup:
```bash
cd backend
cp .env.example .env
# Edit .env to set SECRET_KEY, DASHSCOPE_API_KEY, etc.
python -m venv .venv
source .venv/bin/activate  # or .\.venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### 2. Frontend Setup:
```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm install
npm run build
npm run start
```

#### 3. Health & Readiness Verification:
```bash
# Service Health
curl http://localhost:8000/health
# Response: {"status":"ok","service":"AgriGuard AI","environment":"production",...}

# Service Readiness (DB + Models + RAG)
curl http://localhost:8000/ready
# Response: {"status":"ready","database":{"ok":true},"classifier":{"ok":true},"districts_data":{"ok":true},"rag_service":{"ok":true}}
```

---

### Method B: Containerized Local Production Stack (Docker Compose)

From the project root:
```bash
cd docker
docker-compose up --build -d
```
- Frontend UI accessible at `http://localhost:3000`
- Backend API & OpenAPI documentation accessible at `http://localhost:8000/docs`

---

## 3. Step-by-Step Alibaba Cloud Deployment Guide (Ready Upon Credential Provision)

Once Alibaba Cloud credits/access are provided by the hackathon organizers, execute the following steps:

### Step 1: Provision ECS & Networking
1. Create a VPC in the region (`ap-southeast-1` Singapore or `me-central-1` Dubai).
2. Create Security Groups:
   - Inbound: `80` (HTTP), `443` (HTTPS), `22` (SSH bastion).
   - Outbound: All traffic.
3. Launch an ECS Ubuntu 22.04 LTS instance.

### Step 2: Configure Alibaba Cloud OSS (Object Storage)
1. In the OSS Console, create a private bucket named `agriguard-assets-prod`.
2. Configure bucket lifecycle rules: auto-expire temporary Grad-CAM images after 30 days.
3. Attach RAM Role `AliyunOSSRole` to the ECS instance for credential-less IAM authorization.

### Step 3: Configure DashScope Model Studio (Qwen API)
1. Obtain the Alibaba Cloud Model Studio API key from the Alibaba Cloud console.
2. In `backend/.env`, configure:
   ```env
   DASHSCOPE_API_KEY=sk-your-actual-dashscope-key
   DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
   QWEN_MODEL=qwen-turbo
   ADVISOR_MOCK_MODE=false
   ```

### Step 4: Deploy Containerized Application
1. Clone the repository on the ECS instance:
   ```bash
   git clone https://github.com/organization/agriguard-ai.git
   cd agriguard-ai/docker
   ```
2. Set production environment variables in `backend/.env` and `frontend/.env.local`.
3. Launch production stack with Nginx SSL reverse proxy:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Step 5: Post-Deployment Smoke Test
Run the automated smoke test script:
```bash
curl -f https://api.agriguard.ai/ready
curl -f https://agriguard.ai/
```

---

## 4. Production Security & Safety Controls

1. **Anonymous Isolation**: Zero personally identifiable information (PII) or user passwords stored; device isolation managed strictly through anonymous UUIDs.
2. **Geo-Privacy Guard**: Exact farmer coordinates are never saved to disk or broadcast over map telemetry; only aggregated district centroids are exposed.
3. **Safety Gatekeeper for Chemical Recommendations**: RAG pipeline refuses to synthesize unverified chemical dosage quantities, routing users directly to human agricultural extension experts.
