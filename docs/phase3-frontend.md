# Phase 3 — Mobile-First Disease Diagnosis Frontend Documentation

## Overview

Phase 3 builds the complete mobile-first Next.js frontend interface for AgriGuard AI.

---

## 1. Routes & Pages

| Route | Page Component | Description |
|-------|----------------|-------------|
| `/` | `app/page.tsx` | Mobile-first landing page ("Know the risk before the damage.") with CTAs and 3 feature cards |
| `/diagnose` | `app/diagnose/page.tsx` | Crop scanner with camera capture, photo preview, crop/language/district selectors, client validation & progressive loading |
| `/results` | `app/results/page.tsx` | Comprehensive diagnosis results with AI Assessment, low-confidence warnings, severity tiers, Grad-CAM overlays, top 3 predictions & expert escalation |
| `/risk-map` | `app/risk-map/page.tsx` | Placeholder navigation target ("Coming in Phase 5") |
| `/advisor` | `app/advisor/page.tsx` | Placeholder navigation target ("Coming in Phase 6") |
| `/dashboard` | `app/dashboard/page.tsx` | Placeholder navigation target ("Coming in next phase") |

---

## 2. API Integration (`frontend/lib/api.ts`)

- Endpoint target: **`POST /api/v1/analyze`**
- Base URL read from environment variable `NEXT_PUBLIC_API_BASE_URL` (default fallback `http://localhost:8000`).
- Error Handling:
  - `ApiError(400)`: Invalid or corrupt image payload
  - `ApiError(413)`: Image exceeds 10 MB limit
  - `ApiError(415)`: Unsupported file MIME type
  - `ApiError(422)`: Validation error
  - `ApiError(503)`: AI diagnosis temporarily unavailable alert (**never silently falls back to mock mode**)
  - `ApiError(0)`: Network connection failure alert

---

## 3. Key UI & Safety Features

1. **Client-Side Validation**:
   - MIME types: `image/jpeg`, `image/png`, `image/webp`
   - File size: max 10 MB (`10,485,760 bytes`)
   - Pre-upload validation with instant user feedback

2. **Progressive Loading Experience**:
   - Progressive stage messages during analysis:
     1. *"Analyzing your crop..."*
     2. *"Checking leaf condition..."*
     3. *"Estimating severity..."*
     4. *"Preparing explanation..."*
   - Duplicate form submissions strictly disabled.

3. **Results Page**:
   - **DEMO MODE Badge**: Displays when `is_mock=true` with disclosure text.
   - **Low-Confidence Alert**: Displays prominent warning when `uncertain=true` (*"AI confidence is low. Expert review is recommended."*).
   - **Visual Severity Indicator**: Color-coded progress bar (Healthy → green, Low → lime, Moderate → amber, Severe → red) + heuristic estimate disclaimer.
   - **Grad-CAM Overlay**: Renders base64 heatmap when available; remains hidden if `null` (no fake heatmaps).
   - **Expert Escalation Card**: Triggers when `escalate=true` or `uncertain=true` with configurable WhatsApp hotline (`NEXT_PUBLIC_EXPERT_WHATSAPP_NUMBER`).

---

## 4. How to Run the Frontend

```bash
cd frontend

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start
```
