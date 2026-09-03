"""
AgriGuard AI — FastAPI Application
====================================
Entry point. Sets up:
  - CORS
  - Static file serving (Grad-CAM images)
  - Lifespan events (model loading at startup)
  - API router registration
  - Health and Readiness endpoints
  - Production logging and exception handling
"""
from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import AsyncSessionLocal, Base, engine

# Configure root logger
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan — startup & shutdown ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initialise all resources at startup; clean up on shutdown."""
    logger.info(f"Starting {settings.app_name} ({settings.app_env})")

    # Create DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Ensure device_id column exists on existing SQLite databases
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE diagnoses ADD COLUMN device_id VARCHAR(64)"))
        except Exception:
            pass  # Column already exists
    logger.info("Database tables created/verified.")

    # Create static directories
    (settings.static_dir / "gradcam").mkdir(parents=True, exist_ok=True)
    (settings.static_dir / "uploads").mkdir(parents=True, exist_ok=True)

    # Load districts for geo privacy layer
    from app.services.geo.privacy import load_districts
    load_districts()

    # Load ML models (respects DIAGNOSIS_MOCK_MODE and MOCK_ML_MODELS flags)
    from app.services.vision.classifier import classifier
    classifier.load()

    from app.services.rag.embedder import load_embedding_model
    load_embedding_model()

    from app.services.rag.retriever import load_index
    load_index()

    logger.info(f"{settings.app_name} ready. Mock mode: {settings.mock_ml_models}")

    yield  # ← app is running

    logger.info(f"Shutting down {settings.app_name}.")


# ── Application factory ────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description=(
            "Agricultural disease intelligence platform for Pakistan. "
            "Computer vision · Grad-CAM · Multilingual RAG · Privacy-preserving maps."
        ),
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Production Error Handler ──────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            f"Unhandled server error on {request.method} {request.url.path}: {exc}",
            exc_info=True,
        )
        if settings.app_env == "production":
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "An unexpected server error occurred. Please retry later."},
            )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc)},
        )

    # ── Static files (Grad-CAM overlays) ─────────────────────────────────────
    settings.static_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/static", StaticFiles(directory=str(settings.static_dir)), name="static")

    # ── API Routers ───────────────────────────────────────────────────────────
    from app.api.v1 import analyze, chat, diagnosis, expert, weather
    from app.api.v1 import map as map_router

    API_PREFIX = "/api/v1"
    app.include_router(diagnosis.router, prefix=API_PREFIX)
    app.include_router(analyze.router, prefix=API_PREFIX)
    app.include_router(weather.router, prefix=API_PREFIX)
    app.include_router(chat.router, prefix=API_PREFIX)
    app.include_router(map_router.router, prefix=API_PREFIX)
    app.include_router(expert.router, prefix=API_PREFIX)

    # ── Health Endpoints ──────────────────────────────────────────────────────
    async def get_health_status() -> dict:
        from app.services.vision.classifier import classifier as clf
        return {
            "status": "ok",
            "service": settings.app_name,
            "environment": settings.app_env,
            "mock_ml_models": settings.mock_ml_models,
            "diagnosis_mock_mode": settings.diagnosis_mock_mode,
            "advisor_mock_mode": settings.advisor_mock_mode,
            "classifier_loaded": clf.is_loaded,
        }

    @app.get("/health", tags=["health"], summary="Service health check (root)")
    async def root_health() -> dict:
        return await get_health_status()

    @app.get("/api/v1/health", tags=["health"], summary="Service health check (v1)")
    async def v1_health() -> dict:
        return await get_health_status()

    # ── Readiness Endpoints ───────────────────────────────────────────────────
    async def get_readiness_status() -> JSONResponse:
        from sqlalchemy import text

        from app.services.geo.privacy import _districts, load_districts
        from app.services.rag.retriever import get_index_and_docs
        from app.services.vision.classifier import classifier as clf

        db_ok = False
        db_error = None
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
                db_ok = True
        except Exception as exc:
            db_error = str(exc)
            logger.warning(f"Database readiness check failed: {exc}")

        if not _districts:
            load_districts()

        idx, docs = get_index_and_docs()
        clf_ready = clf.is_loaded or settings.diagnosis_mock_mode
        districts_ready = len(_districts) > 0
        rag_ready = (
            (idx is not None and len(docs) > 0)
            or settings.advisor_mock_mode
            or settings.mock_ml_models
        )

        is_ready = db_ok and clf_ready and districts_ready

        payload = {
            "status": "ready" if is_ready else "not_ready",
            "database": {"ok": db_ok, "error": db_error},
            "classifier": {"ok": clf_ready, "is_loaded": clf.is_loaded},
            "districts_data": {"ok": districts_ready, "count": len(_districts)},
            "rag_service": {
                "ok": rag_ready,
                "has_index": idx is not None,
                "document_count": len(docs),
            },
        }

        status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE
        return JSONResponse(status_code=status_code, content=payload)

    @app.get("/ready", tags=["health"], summary="Service readiness check (root)")
    async def root_ready() -> JSONResponse:
        return await get_readiness_status()

    @app.get("/api/v1/ready", tags=["health"], summary="Service readiness check (v1)")
    async def v1_ready() -> JSONResponse:
        return await get_readiness_status()

    return app


# ── Module-level app instance (used by uvicorn) ────────────────────────────────
app = create_app()
