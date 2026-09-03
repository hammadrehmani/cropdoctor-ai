"""
RAG Service — Multilingual Embedder
=====================================
Encodes text into dense vectors using a multilingual sentence-transformer.
Supports English, Urdu, and Sindhi via paraphrase-multilingual-MiniLM-L12-v2.
"""
from __future__ import annotations

import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

_model: Any = None


def load_embedding_model() -> None:
    """Load sentence-transformer model. Called at app startup."""
    global _model

    if settings.mock_ml_models:
        logger.warning("Embedder: mock mode — embedding model not loaded.")
        return

    try:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(settings.embedding_model)
        logger.info(f"Embedding model loaded: {settings.embedding_model}")

    except ImportError:
        logger.error("sentence-transformers not installed.")
    except Exception as exc:
        logger.exception(f"Failed to load embedding model: {exc}")


def get_embedding_model() -> Any:
    """Get or lazily initialize the embedding model."""
    global _model
    if _model is None and not settings.mock_ml_models:
        load_embedding_model()
    return _model


async def embed(text: str) -> list[float]:
    """
    Encode text to a normalized dense embedding vector.

    Returns:
        list[float]: 384-dim vector (MiniLM-L12-v2) or zero vector in mock mode.
    """
    if settings.mock_ml_models:
        return [0.0] * 384

    model = get_embedding_model()
    if model is None:
        return [0.0] * 384

    try:
        embedding = model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
    except Exception as exc:
        logger.exception(f"Embedding failed: {exc}")
        return [0.0] * 384
