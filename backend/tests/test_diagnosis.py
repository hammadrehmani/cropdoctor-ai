"""
Tests — Diagnosis & Diagnosis History endpoints.
"""
from __future__ import annotations

import io

import pytest
from httpx import AsyncClient

from app.config import settings
from app.services.vision.classifier import classifier


@pytest.fixture(autouse=True)
def ensure_mock_mode_for_legacy_tests():
    """Phase 1 legacy diagnosis tests require mock mode."""
    original_mock = settings.diagnosis_mock_mode
    settings.diagnosis_mock_mode = True
    classifier.load()
    yield
    settings.diagnosis_mock_mode = original_mock
    classifier.load()


@pytest.mark.asyncio
async def test_health(client: AsyncClient) -> None:
    """Health endpoint returns 200 with expected fields."""
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "mock_ml_models" in data


@pytest.mark.asyncio
async def test_diagnose_mock_returns_200(client: AsyncClient) -> None:
    """Diagnosis endpoint returns 200 with all required fields in mock mode."""
    # Minimal 1x1 JPEG
    jpeg_bytes = (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
        b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
        b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
        b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\x1e"
        b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f"
        b"\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00"
        b"\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01"
        b"\x00\x00?\x00\xfb\xff\xd9"
    )
    files = {"image": ("leaf.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}
    data = {"crop": "wheat"}

    resp = await client.post("/api/v1/diagnose", files=files, data=data)
    assert resp.status_code == 200

    body = resp.json()
    assert "diagnosis_id" in body
    assert "disease" in body
    assert "confidence" in body
    assert 0.0 <= body["confidence"] <= 1.0
    assert "severity_pct" in body
    assert "risk_level" in body
    assert "escalate" in body
    assert body["is_mock"] is True


@pytest.mark.asyncio
async def test_diagnose_low_confidence_escalates(client: AsyncClient) -> None:
    """
    CRITICAL BEHAVIOUR: any result with confidence < threshold must set escalate=True.
    """
    original = settings.expert_confidence_threshold
    settings.expert_confidence_threshold = 0.99  # Force escalation

    try:
        jpeg_bytes = b"\xff\xd8\xff\xd9"  # Minimal valid JPEG stub
        files = {"image": ("leaf.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}
        data = {"crop": "cotton"}
        resp = await client.post("/api/v1/diagnose", files=files, data=data)
        assert resp.status_code == 200
        assert resp.json()["escalate"] is True
    finally:
        settings.expert_confidence_threshold = original


@pytest.mark.asyncio
async def test_diagnose_invalid_crop(client: AsyncClient) -> None:
    """Invalid crop type returns 422."""
    files = {"image": ("leaf.jpg", io.BytesIO(b"\xff\xd8\xff\xd9"), "image/jpeg")}
    data = {"crop": "banana"}  # Not in CropType enum
    resp = await client.post("/api/v1/diagnose", files=files, data=data)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_diagnose_no_raw_coords_in_response(client: AsyncClient) -> None:
    """
    PRIVACY: raw GPS coordinates submitted in the request must NEVER appear
    in the response body. Only district name (if any) should be present.
    """
    farmer_lat, farmer_lon = 31.4180, 72.9978  # Faisalabad area
    files = {"image": ("leaf.jpg", io.BytesIO(b"\xff\xd8\xff\xd9"), "image/jpeg")}
    data = {"crop": "wheat", "lat": farmer_lat, "lon": farmer_lon}
    resp = await client.post("/api/v1/diagnose", files=files, data=data)
    assert resp.status_code == 200

    resp_text = resp.text
    assert str(farmer_lat) not in resp_text, "Raw farmer latitude found in response!"
    assert str(farmer_lon) not in resp_text, "Raw farmer longitude found in response!"


@pytest.mark.asyncio
async def test_list_diagnoses_history(client: AsyncClient) -> None:
    """GET /api/v1/diagnoses returns paginated history list."""
    # 1. Trigger a diagnosis to ensure at least one record exists
    files = {"image": ("leaf.jpg", io.BytesIO(b"\xff\xd8\xff\xd9"), "image/jpeg")}
    data = {"crop": "wheat"}
    diag_resp = await client.post("/api/v1/diagnose", files=files, data=data)
    assert diag_resp.status_code == 200
    created_id = diag_resp.json()["diagnosis_id"]

    # 2. Fetch history list
    resp = await client.get("/api/v1/diagnoses?limit=10&offset=0")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert "total" in body
    assert body["total"] >= 1
    assert len(body["items"]) >= 1

    # Verify fields of history item
    item = body["items"][0]
    assert "id" in item
    assert "crop" in item
    assert "disease" in item
    assert "confidence" in item
    assert "severity_pct" in item
    assert "severity_tier" in item
    assert "is_mock" in item
    assert "created_at" in item

    # 3. Fetch specific diagnosis item by ID
    single_resp = await client.get(f"/api/v1/diagnoses/{created_id}")
    assert single_resp.status_code == 200
    assert single_resp.json()["id"] == created_id


@pytest.mark.asyncio
async def test_get_diagnosis_not_found_404(client: AsyncClient) -> None:
    """GET /api/v1/diagnoses/{nonexistent} returns 404."""
    resp = await client.get("/api/v1/diagnoses/nonexistent-id-0000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_device_id_persistence_and_history_isolation(client: AsyncClient) -> None:
    """
    ANONYMOUS DEVICE_ID & ISOLATION REQUIREMENT:
    1. Diagnoses saved with device_id persist the device_id attribute.
    2. Querying history with ?device_id=devA returns only devA's records.
    3. Querying history with ?device_id=devB returns only devB's records.
    """
    dev_a = "device-uuid-test-aaa"
    dev_b = "device-uuid-test-bbb"

    jpeg_bytes = b"\xff\xd8\xff\xd9"

    # Create diagnosis for Device A
    files_a = {"image": ("leaf_a.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}
    data_a = {"crop": "cotton", "device_id": dev_a}
    resp_a = await client.post("/api/v1/diagnose", files=files_a, data=data_a)
    assert resp_a.status_code == 200
    diag_id_a = resp_a.json()["diagnosis_id"]

    # Create diagnosis for Device B
    files_b = {"image": ("leaf_b.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}
    data_b = {"crop": "wheat", "device_id": dev_b}
    resp_b = await client.post("/api/v1/diagnose", files=files_b, data=data_b)
    assert resp_b.status_code == 200
    diag_id_b = resp_b.json()["diagnosis_id"]

    # Fetch history for Device A -> must contain A, must NOT contain B
    resp_hist_a = await client.get(f"/api/v1/diagnoses?device_id={dev_a}")
    assert resp_hist_a.status_code == 200
    items_a = resp_hist_a.json()["items"]
    ids_a = [item["id"] for item in items_a]
    assert diag_id_a in ids_a
    assert diag_id_b not in ids_a
    for item in items_a:
        assert item["device_id"] == dev_a

    # Fetch history for Device B -> must contain B, must NOT contain A
    resp_hist_b = await client.get(f"/api/v1/diagnoses?device_id={dev_b}")
    assert resp_hist_b.status_code == 200
    items_b = resp_hist_b.json()["items"]
    ids_b = [item["id"] for item in items_b]
    assert diag_id_b in ids_b
    assert diag_id_a not in ids_b
    for item in items_b:
        assert item["device_id"] == dev_b

    # Verify single item retrieval returns device_id
    single_a = await client.get(f"/api/v1/diagnoses/{diag_id_a}")
    assert single_a.status_code == 200
    assert single_a.json()["device_id"] == dev_a

