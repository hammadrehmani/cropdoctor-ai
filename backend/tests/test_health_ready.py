"""
Tests for Health and Readiness endpoints (Phase 7).
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_health_endpoint(client: AsyncClient):
    """Verify /health returns 200 and service metadata."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data
    assert "environment" in data


@pytest.mark.asyncio
async def test_v1_health_endpoint(client: AsyncClient):
    """Verify /api/v1/health returns 200 and matches root health."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_root_readiness_endpoint(client: AsyncClient):
    """Verify /ready performs active database and service checks."""
    response = await client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"]["ok"] is True
    assert data["classifier"]["ok"] is True
    assert data["districts_data"]["ok"] is True
    assert data["rag_service"]["ok"] is True


@pytest.mark.asyncio
async def test_v1_readiness_endpoint(client: AsyncClient):
    """Verify /api/v1/ready returns identical readiness status."""
    response = await client.get("/api/v1/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
