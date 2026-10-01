"""
CropDoctor Ai — Database Engine & Session
=========================================
Uses SQLAlchemy 2.x async engine.
Switch DATABASE_URL in .env to move from SQLite → PostgreSQL/PostGIS
with zero code changes.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
# connect_args only needed for SQLite (prevents "same thread" error)
_connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_async_engine(
    settings.database_url,
    connect_args=_connect_args,
    echo=settings.is_development,  # SQL logging in dev
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Base ──────────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """All ORM models inherit from this base."""
    pass


# ── Dependency ────────────────────────────────────────────────────────────────
async def get_db() -> AsyncSession:  # type: ignore[return]
    """FastAPI dependency — yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
