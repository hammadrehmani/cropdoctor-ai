# ADR-001: SQLite for Development, PostgreSQL/PostGIS for Production

**Date**: 2026-08-23
**Status**: Accepted

## Context

AgriGuard AI needs persistent storage for diagnoses, chat sessions, and expert requests. For the hackathon demo, zero-configuration setup is essential. For production on Alibaba Cloud, PostGIS is needed for geospatial queries on district-level data.

## Decision

Use SQLite (via aiosqlite async driver) for development. Switch to PostgreSQL by changing a single `DATABASE_URL` environment variable. All ORM models use SQLAlchemy 2.x and are database-agnostic.

## Consequences

- Zero-config local development
- Single env var swap to PostgreSQL — no code changes needed
- Alembic migrations work with both databases

---

# ADR-002: GPS Privacy — Server-Side Immediate Fuzzing

**Date**: 2026-08-23
**Status**: Accepted

## Context

Farmer GPS coordinates must never be exposed on the public map. This is both an ethical requirement and a regulatory consideration under Pakistan's data protection framework.

## Decision

- Raw coordinates are accepted at the API boundary only
- They are immediately passed to `geo/privacy.py::coords_to_district()`
- The result is a district name + centroid (from a public dataset)
- Raw coordinates are **never** assigned to a variable that persists beyond the request handler
- Database stores only district name (a string)
- Map markers use centroid ± 2 km random jitter

## Consequences

- Farmers cannot be individually identified from the map
- District-level aggregate data remains useful for research
- System is honest: privacy contract is documented in code comments

---

# ADR-003: MOCK_ML_MODELS Feature Flag

**Date**: 2026-08-23
**Status**: Accepted

## Context

The hackathon demo needs to run on hardware without a GPU and without real model weights. Faking AI results (without disclosure) would be misleading.

## Decision

- `MOCK_ML_MODELS=true` (default) causes all ML services to return deterministic stub results
- The API response includes `"is_mock": true`
- The frontend displays a prominent yellow disclaimer banner when `is_mock=true`
- Mock results are seeded (crop-specific) for reproducible demos
- Setting `MOCK_ML_MODELS=false` requires actual weight files to be present

## Consequences

- Demo works without GPU
- Judges and farmers are never misled about AI capability
- Clear upgrade path: train models → place weights → flip flag

---

# ADR-004: DashScope OpenAI-Compatible Client

**Date**: 2026-08-23
**Status**: Accepted

## Context

Qwen models are available via Alibaba Cloud DashScope with an OpenAI-compatible API surface.

## Decision

Use the `openai` Python package with `base_url=DASHSCOPE_BASE_URL`. This means:
- No DashScope-specific SDK dependency
- Identical code works with OpenAI gpt-4o if needed
- Model is configurable via `QWEN_MODEL` env var

## Consequences

- Single dependency for LLM calls
- Easy model swapping without code changes
- If DashScope API changes, only the base URL env var needs updating
