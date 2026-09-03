# AgriGuard AI — Deployment Status & Production Guide

## Executive Status

- **Alibaba Cloud deployment: BLOCKED BY HACKATHON ACCESS — NOT YET AVAILABLE.**
- **Local production readiness: VERIFIED.**
- **Status:** Deployment-ready; pending organizer-provided Alibaba Cloud access.

For full architectural diagrams, Alibaba Cloud provisioning steps, and production operations, see [`docs/deployment.md`](docs/deployment.md).

---

## Quick Local Production Verification

```bash
# 1. Start Backend
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000

# 2. Verify Health & Readiness
curl http://localhost:8000/health
curl http://localhost:8000/ready

# 3. Start Frontend
cd ../frontend
npm install
npm run build
npm run start
```
