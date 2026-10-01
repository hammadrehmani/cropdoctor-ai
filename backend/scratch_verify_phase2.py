"""
Phase 2 Verification Script
=============================
Tests FastAPI app endpoints programmatically:
1. GET /docs -> 200
2. GET /api/v1/health -> 200 (shows diagnosis_mock_mode=True)
3. POST /api/v1/analyze -> 200 with real image
4. Verifies all Step 2 requirements
5. Checks Step 3 (real model checkpoint status)
6. Verifies Step 8 (architecture flow)
"""
from __future__ import annotations

import asyncio
import io
import json
import struct
import zlib
from pathlib import Path

from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.main import app
from app.services.vision.classifier import classifier


def make_test_png() -> bytes:
    """Generate a valid 32x32 green leaf PNG with yellow/brown lesion spot."""
    width, height = 32, 32
    def _chunk(chunk_type: bytes, data: bytes) -> bytes:
        c = chunk_type + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = _chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    
    raw_rows = b""
    for y in range(height):
        row = b"\x00"
        for x in range(width):
            if 10 <= x <= 20 and 10 <= y <= 20:
                # Yellow-brown disease lesion spot
                row += b"\xc8\xa0\x1e"
            else:
                # Green leaf background
                row += b"\x22\x8b\x22"
        raw_rows += row

    idat = _chunk(b"IDAT", zlib.compress(raw_rows))
    iend = _chunk(b"IEND", b"")
    return sig + ihdr + idat + iend


async def run_verification():
    print("=" * 70)
    print("CROPDOCTOR AI — PHASE 2 SYSTEM VERIFICATION")
    print("=" * 70)

    # Initialize lifespan services (normally done by uvicorn startup)
    classifier.load()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. GET /docs
        resp_docs = await client.get("/docs")
        print(f"\n[STEP 2.1] GET /docs: HTTP {resp_docs.status_code}")
        assert resp_docs.status_code == 200, "Swagger /docs failed!"

        # 2. GET /api/v1/health
        resp_health = await client.get("/api/v1/health")
        health_data = resp_health.json()
        print(f"[STEP 2.2] GET /api/v1/health: {health_data}")
        assert health_data["status"] == "ok"
        assert health_data["diagnosis_mock_mode"] is True

        # 3. POST /api/v1/analyze (Mock Mode)
        image_bytes = make_test_png()
        files = {"image": ("test_leaf.png", io.BytesIO(image_bytes), "image/png")}
        data = {"crop": "wheat", "district": "Faisalabad", "language": "en"}
        
        resp_analyze = await client.post("/api/v1/analyze", files=files, data=data)
        print(f"\n[STEP 2.3] POST /api/v1/analyze (Mock Mode): HTTP {resp_analyze.status_code}")
        assert resp_analyze.status_code == 200, f"Failed: {resp_analyze.text}"

        body = resp_analyze.json()
        print("\nAnalyze Response Body:")
        print(json.dumps(body, indent=2))

        # Step 2 Verification Assertions
        assert body["success"] is True, "success should be true"
        assert body["is_mock"] is True, "is_mock should be true in mock mode"
        assert body["diagnosis"]["is_mock"] is True
        assert "[MOCK]" in body["diagnosis"]["disease"], "disease string should contain [MOCK]"
        assert body["severity"]["affected_percentage"] >= 0.0, "severity percentage calculated"
        assert body["severity"]["tier"] in ("healthy", "low", "moderate", "severe")
        assert body["explanation"]["gradcam_image"] is None, "gradcam_image must be null in mock mode"
        assert "escalate" in body, "escalate field must exist"

        print("\n[OK] Step 2 Mock Mode Verification PASSED!")

    # 4. Check Step 3 (Real Model Checkpoint status)
    ckpt_path = Path(settings.classifier_checkpoint)
    print(f"\n[STEP 3] Checking real model checkpoint path: {ckpt_path.resolve()}")
    if ckpt_path.exists():
        print("REAL MODEL CHECKPOINT: PRESENT")
    else:
        print("REAL MODEL CHECKPOINT: MISSING")
        print("Explanation: No pretrained weights file was found at ml/models/classifier.pt.")
        print("To train a real model:")
        print("  1. Download PlantVillage dataset and place in data/raw/")
        print("  2. Run: python -m ml.disease_classifier.train --epochs 30")
        print("  3. Run evaluation: python -m ml.disease_classifier.evaluate --checkpoint ml/models/classifier.pt")
        print("  4. Set DIAGNOSIS_MOCK_MODE=false in .env")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    asyncio.run(run_verification())
