"""
ML Script — Build Multilingual RAG Knowledge Base Index (Phase 4)
================================================================
Reads all structured markdown documents from data/knowledge_base/,
extracts metadata (crop, disease, language, source, title),
generates multilingual sentence embeddings (paraphrase-multilingual-MiniLM-L12-v2),
and builds a reproducible FAISS index with metadata storage.

Usage:
    cd backend
    python ml/scripts/build_rag_index.py
"""
from __future__ import annotations

import json
import pickle
import re
import sys
from pathlib import Path

# Add backend root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.config import settings


def parse_frontmatter_and_sections(
    content: str,
    fallback_crop: str,
    fallback_lang: str,
) -> list[dict]:
    """Parse YAML frontmatter and disease sections from a markdown document."""
    meta = {
        "crop": fallback_crop,
        "language": fallback_lang,
        "source": "Pakistan Agricultural Extension & FAO",
        "source_title": f"{fallback_crop.capitalize()} Disease Management",
    }

    body = content
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            fm_text = parts[1]
            body = parts[2]
            for line in fm_text.strip().split("\n"):
                if ":" in line:
                    k, v = line.split(":", 1)
                    meta[k.strip()] = v.strip()

    # Split by level 2 headings (## Disease Name)
    sections = re.split(r"\n(?=##\s+)", body)
    chunks = []

    for i, section in enumerate(sections):
        cleaned = section.strip()
        if not cleaned or cleaned.startswith("# "):
            continue

        # Extract disease title if present
        title_match = re.match(r"^##\s+(.+)", cleaned)
        disease_name = (
            title_match.group(1).strip()
            if title_match
            else meta.get("source_title", "Disease Guide")
        )

        chunks.append({
            "chunk_id": f"{meta['crop']}_{meta['language']}_{i}",
            "crop": meta["crop"].lower(),
            "disease": disease_name,
            "language": meta["language"].lower(),
            "source": meta["source"],
            "source_title": meta["source_title"],
            "text": cleaned,
        })

    # If no ## headings found, fallback to chunking
    if not chunks and body.strip():
        chunks.append({
            "chunk_id": f"{meta['crop']}_{meta['language']}_0",
            "crop": meta["crop"].lower(),
            "disease": meta.get("source_title", "Disease Guide"),
            "language": meta["language"].lower(),
            "source": meta["source"],
            "source_title": meta["source_title"],
            "text": body.strip(),
        })

    return chunks


def build_index() -> None:
    try:
        import faiss
        import numpy as np
        from sentence_transformers import SentenceTransformer
    except ImportError as e:
        print(f"[ERROR] Missing dependency: {e}. Run: pip install sentence-transformers faiss-cpu")
        sys.exit(1)

    kb_dir = Path(__file__).resolve().parents[3] / "data" / "knowledge_base"
    if not kb_dir.exists():
        print(f"[ERROR] Knowledge base directory not found at {kb_dir}")
        sys.exit(1)

    print(f"Reading knowledge base from: {kb_dir}")
    print(f"Loading embedding model: {settings.embedding_model}")
    model = SentenceTransformer(settings.embedding_model)

    docs: list[dict] = []
    texts: list[str] = []

    for md_file in sorted(kb_dir.rglob("*.md")):
        crop = md_file.parent.name
        stem = md_file.stem
        lang = "en"
        if "_ur" in stem:
            lang = "ur"
        elif "_sd" in stem:
            lang = "sd"

        content = md_file.read_text(encoding="utf-8")
        file_chunks = parse_frontmatter_and_sections(
            content, fallback_crop=crop, fallback_lang=lang
        )

        for chunk in file_chunks:
            docs.append(chunk)
            texts.append(chunk["text"])

        print(f"  Loaded {len(file_chunks)} chunks from {md_file.relative_to(kb_dir)}")

    if not texts:
        print("No knowledge base chunks found.")
        sys.exit(1)

    print(f"\nGenerating multilingual embeddings for {len(texts)} chunks...")
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    embeddings = np.array(embeddings, dtype=np.float32)

    dim = embeddings.shape[1]
    print(f"Building FAISS IndexFlatIP (dim={dim}, count={embeddings.shape[0]})...")
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    out_idx_path = Path(settings.faiss_index_path)
    out_meta_path = Path(settings.faiss_docs_path)
    out_json_path = out_meta_path.with_suffix(".json")

    out_idx_path.parent.mkdir(parents=True, exist_ok=True)

    faiss.write_index(index, str(out_idx_path))
    with open(out_meta_path, "wb") as f:
        pickle.dump(docs, f)
    with open(out_json_path, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False, indent=2)

    print(f"\n[OK] FAISS index saved:     {out_idx_path}")
    print(f"[OK] Metadata pickle saved: {out_meta_path}")
    print(f"[OK] Metadata JSON saved:   {out_json_path}")
    print(f"Total indexed chunks:  {index.ntotal}")


if __name__ == "__main__":
    build_index()
