"""
Pytest configuration and shared fixtures.
"""
from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


# Modern pytest-asyncio requires this for async fixtures
pytest_plugins = ("pytest_asyncio",)


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    """Async test client for the FastAPI app with lifespan context."""
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac
