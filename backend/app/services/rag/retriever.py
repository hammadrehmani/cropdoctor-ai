"""
RAG Service — FAISS Retriever (Phase 4)
=======================================
Loads the pre-built multilingual FAISS index and retrieves top-k relevant
agricultural knowledge chunks for a query embedding with similarity scores and metadata.
"""
from __future__ import annotations

import logging
import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

_index: Any = None
_docs: list[dict] = []


@dataclass
class RetrievedChunk:
    chunk_id: str
    crop: str
    disease: str
    language: str
    source: str
    source_title: str
    text: str
    score: float


@dataclass
class RetrievalResult:
    chunks: list[RetrievedChunk]
    top_score: float
    is_confident: bool


def load_index() -> None:
    """Load FAISS index and document store. Called at app startup or lazily."""
    global _index, _docs

    if settings.mock_ml_models:
        logger.warning("Retriever: mock mode — FAISS index not loaded.")
        return

    try:
        import faiss

        idx_path = Path(settings.faiss_index_path)
        docs_path = Path(settings.faiss_docs_path)

        if not idx_path.exists() or not docs_path.exists():
            backend_root = Path(__file__).resolve().parents[3]
            candidates = [
                (backend_root / idx_path, backend_root / docs_path),
                (backend_root / "ml" / "faiss" / "cropdoctor.index", backend_root / "ml" / "faiss" / "cropdoctor_docs.pkl"),
                (Path.cwd() / "backend" / "ml" / "faiss" / "cropdoctor.index", Path.cwd() / "backend" / "ml" / "faiss" / "cropdoctor_docs.pkl"),
            ]
            for c_idx, c_docs in candidates:
                if c_idx.exists() and c_docs.exists():
                    idx_path, docs_path = c_idx, c_docs
                    break

        if not idx_path.exists() or not docs_path.exists():
            logger.warning(
                f"FAISS index files not found ({idx_path}, {docs_path}). "
                "Run ml/scripts/build_rag_index.py to build them."
            )
            return

        _index = faiss.read_index(str(idx_path))
        with open(docs_path, "rb") as f:
            _docs = pickle.load(f)

        logger.info(f"FAISS index loaded: {_index.ntotal} vectors, {len(_docs)} docs.")

    except ImportError:
        logger.error("faiss-cpu not installed.")
    except Exception as exc:
        logger.exception(f"Failed to load FAISS index: {exc}")


def get_index_and_docs() -> tuple[Any, list[dict]]:
    """Get or lazily load the FAISS index and documents."""
    global _index, _docs
    if (_index is None or not _docs) and not settings.mock_ml_models:
        load_index()
    return _index, _docs


_MOCK_CHUNKS = [
    RetrievedChunk(
        chunk_id="wheat_en_powdery",
        crop="wheat",
        disease="Powdery Mildew — Blumeria graminis f. sp. tritici",
        language="en",
        source="FAO & Pakistan Directorate of Agricultural Information",
        source_title="Wheat Disease Management Guide",
        text=(
            "## Powdery Mildew — Blumeria graminis f. sp. tritici\n"
            "- Crop: Wheat\n"
            "- Symptoms: White to light-grey powdery fungal patches on upper leaf surfaces, stems, and leaf sheaths.\n"
            "- Favourable Conditions: Dense crop canopies, high humidity (85–100%), and moderate temperatures (15–20°C) with low sunlight.\n"
            "- Prevention & Cultural Control: Avoid excessive nitrogen fertilization; maintain balanced N-P-K nutrition and optimal seed rate to prevent dense foliage.\n"
            "- Management: Implement preventive canopy aeration. If upper leaves are colonized, consult local extension officers for approved systemic foliar treatments (such as registered triazole or strobilurin fungicides)."
        ),
        score=0.85,
    ),
    RetrievedChunk(
        chunk_id="wheat_en_0",
        crop="wheat",
        disease="Leaf Rust (Brown Rust)",
        language="en",
        source="FAO & Pakistan Directorate of Agricultural Information",
        source_title="Wheat Disease Management Guide",
        text=(
            "Leaf Rust (Puccinia triticina) is widespread in Pakistan. Small orange-brown "
            "pustules on leaves. Management: use resistant varieties and early planting."
        ),
        score=0.75,
    ),
    RetrievedChunk(
        chunk_id="wheat_en_yellow_rust",
        crop="wheat",
        disease="Yellow Rust (Stripe Rust) — Puccinia striiformis",
        language="en",
        source="FAO & Pakistan Directorate of Agricultural Information",
        source_title="Wheat Disease Management Guide",
        text=(
            "Yellow Rust (Puccinia striiformis) exhibits yellow-orange pustules arranged in stripes parallel to leaf veins. "
            "Management: Plant resistant cultivars, scout in cool weather, and use recommended protective fungicides."
        ),
        score=0.75,
    ),
    RetrievedChunk(
        chunk_id="cotton_en_0",
        crop="cotton",
        disease="Cotton Leaf Curl Disease (CLCuD)",
        language="en",
        source="Central Cotton Research Institute (CCRI) Multan",
        source_title="Cotton Disease & Pest Management Guide",
        text=(
            "Cotton Leaf Curl Disease is transmitted by whitefly. Symptoms include leaf "
            "curling, dark veins, and enations. Control whitefly and sow resistant varieties."
        ),
        score=0.70,
    ),
]


async def retrieve(
    query_embedding: list[float],
    crop: str | None = None,
    language: str | None = None,
    top_k: int | None = None,
) -> RetrievalResult:
    """
    Retrieve top-k relevant knowledge base chunks using FAISS cosine similarity search.

    Args:
        query_embedding: Dense normalized vector from the embedder.
        crop: Optional crop filter ('wheat', 'cotton', 'rice', 'sugarcane').
        language: Optional language hint ('en', 'ur', 'sd').
        top_k: Max chunks to retrieve (defaults to settings.rag_top_k).

    Returns:
        RetrievalResult containing ranked chunks, top similarity score, and confidence flag.
    """
    k = top_k or settings.rag_top_k
    index, docs = get_index_and_docs()

    if settings.mock_ml_models or index is None or not docs:
        logger.debug("Retriever: returning mock chunks.")
        filtered_mock = [c for c in _MOCK_CHUNKS if (not crop or c.crop.lower() == crop.lower())]
        selected = filtered_mock[:k] if filtered_mock else _MOCK_CHUNKS[:k]
        top_s = selected[0].score if selected else 0.0
        return RetrievalResult(
            chunks=selected,
            top_score=top_s,
            is_confident=top_s >= settings.rag_min_similarity,
        )

    try:
        import numpy as np

        q = np.array([query_embedding], dtype=np.float32)
        # Search more candidates if filtering by crop/language
        search_k = min(len(docs), k * 4 if (crop or language) else k)
        scores, indices = index.search(q, search_k)

        results: list[RetrievedChunk] = []
        for score, idx in zip(scores[0], indices[0]):
            if 0 <= idx < len(docs):
                doc = docs[idx]
                doc_crop = doc.get("crop", "").lower()
                doc_lang = doc.get("language", "").lower()

                # Apply optional crop filter if specified
                if crop and doc_crop and doc_crop != crop.strip().lower():
                    continue

                chunk_obj = RetrievedChunk(
                    chunk_id=doc.get("chunk_id", f"doc_{idx}"),
                    crop=doc_crop,
                    disease=doc.get("disease", "Crop Disease"),
                    language=doc_lang,
                    source=doc.get("source", "Verified Agricultural Extension"),
                    source_title=doc.get("source_title", "Agricultural Advisory Document"),
                    text=doc.get("text", ""),
                    score=float(score),
                )
                results.append(chunk_obj)
                if len(results) >= k:
                    break

        top_score = float(results[0].score) if results else 0.0
        is_confident = top_score >= settings.rag_min_similarity

        return RetrievalResult(
            chunks=results,
            top_score=top_score,
            is_confident=is_confident,
        )

    except Exception as exc:
        logger.exception(f"FAISS retrieval failed: {exc}")
        return RetrievalResult(chunks=[], top_score=0.0, is_confident=False)
