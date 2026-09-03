"""
Tests — Multilingual Chat & AI Advisor endpoint.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from app.config import settings


@pytest.fixture(autouse=True)
def ensure_advisor_mock_for_legacy_tests():
    """Ensure advisor tests run with deterministic mock responses unless overridden."""
    original_mock = settings.advisor_mock_mode
    settings.advisor_mock_mode = True
    yield
    settings.advisor_mock_mode = original_mock


@pytest.mark.asyncio
async def test_chat_english(client: AsyncClient) -> None:
    """English chat returns a non-empty answer."""
    payload = {"message": "What is leaf rust in wheat?", "language": "en", "crop": "wheat"}
    resp = await client.post("/api/v1/chat", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["answer"]
    assert body["language"] == "en"
    assert "session_id" in body
    assert body["is_mock"] is True


@pytest.mark.asyncio
async def test_chat_urdu(client: AsyncClient) -> None:
    """Urdu chat returns a response with correct language tag."""
    payload = {
        "message": "گندم میں پیلے زنگ کی علامات کیا ہیں؟",
        "language": "ur",
        "crop": "wheat",
    }
    resp = await client.post("/api/v1/chat", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["language"] == "ur"
    assert body["answer"]


@pytest.mark.asyncio
async def test_chat_sindhi(client: AsyncClient) -> None:
    """Sindhi chat returns a response with correct language tag."""
    payload = {
        "message": "ڪپهه ۾ پن جي ڪرل بيماري ڇا آهي؟",
        "language": "sd",
        "crop": "cotton",
    }
    resp = await client.post("/api/v1/chat", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["language"] == "sd"
    assert body["answer"]


@pytest.mark.asyncio
async def test_chat_session_continuity(client: AsyncClient) -> None:
    """Session ID is preserved across requests when provided."""
    session_id = "test-session-123"
    payload = {
        "message": "Tell me about rice blast.",
        "language": "en",
        "crop": "rice",
        "session_id": session_id,
    }
    resp = await client.post("/api/v1/chat", json=payload)
    assert resp.status_code == 200
    assert resp.json()["session_id"] == session_id


@pytest.mark.asyncio
async def test_chat_message_too_long(client: AsyncClient) -> None:
    """Messages exceeding 2000 chars are rejected with 422."""
    payload = {"message": "x" * 2001, "language": "en"}
    resp = await client.post("/api/v1/chat", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_chat_empty_message_rejected(client: AsyncClient) -> None:
    """Empty messages are rejected with 422."""
    payload = {"message": "", "language": "en"}
    resp = await client.post("/api/v1/chat", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_advisor_endpoint_alias(client: AsyncClient) -> None:
    """POST /api/v1/advisor functions identically to /api/v1/chat."""
    payload = {
        "message": "How often should I inspect my wheat for rust?",
        "language": "en",
        "crop": "wheat",
        "district": "Faisalabad",
    }
    resp = await client.post("/api/v1/advisor", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["answer"]


@pytest.mark.asyncio
async def test_advisor_diagnosis_context(client: AsyncClient) -> None:
    """Diagnosis context is accepted and parsed without error."""
    payload = {
        "message": "What fungicide should I apply for this disease?",
        "language": "en",
        "crop": "wheat",
        "diagnosis_context": {
            "disease": "Rust",
            "crop": "wheat",
            "confidence": 0.9559,
            "severity_tier": "low",
            "affected_percentage": 12.8,
        },
    }
    resp = await client.post("/api/v1/advisor", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["answer"]


@pytest.mark.asyncio
async def test_advisor_real_mode_missing_key_503(client: AsyncClient) -> None:
    """When ADVISOR_MOCK_MODE=False and API key is unconfigured, return 503 without fallback to mock."""
    original_mock = settings.advisor_mock_mode
    original_key = settings.dashscope_api_key
    try:
        settings.advisor_mock_mode = False
        settings.dashscope_api_key = ""
        payload = {"message": "How to treat rust?", "language": "en"}
        resp = await client.post("/api/v1/advisor", json=payload)
        assert resp.status_code == 503
        assert "temporarily unavailable" in resp.json()["detail"]
    finally:
        settings.advisor_mock_mode = original_mock
        settings.dashscope_api_key = original_key
