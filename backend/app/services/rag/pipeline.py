"""
RAG Service — Pipeline Orchestrator (Phase 4)
=============================================
Ties together:
1. Chemical dosage safety guardrails
2. Multilingual query embedding
3. FAISS semantic retrieval & confidence thresholding
4. Grounded LLM answer generation via Qwen/DashScope
5. Human expert escalation routing
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from app.config import settings
from app.schemas.chat import ChatResponse, Language, SourceItem
from app.services.expert.router import should_escalate_chat
from app.services.rag import embedder, generator, retriever
from app.services.rag.safety import (
    get_low_confidence_response,
    get_safe_dosage_response,
    is_chemical_dosage_query,
)

if TYPE_CHECKING:
    from app.schemas.chat import DiagnosisContext

logger = logging.getLogger(__name__)


async def answer(
    message: str,
    language: Language,
    crop: str | None = None,
    district: str | None = None,
    session_id: str = "",
    diagnosis_context: DiagnosisContext | None = None,
) -> ChatResponse:
    """
    Full Phase 4 RAG pipeline:
    Safety validation → embed → FAISS retrieval → confidence check → Qwen generation.
    """
    # 1. Chemical & Dosage Safety Guardrail Layer
    if is_chemical_dosage_query(message):
        logger.info("RAG Pipeline: chemical dosage query detected — escalating safely.")
        return ChatResponse(
            success=True,
            answer=get_safe_dosage_response(language),
            sources=[],
            language=language,
            session_id=session_id,
            escalate=True,
            retrieval_score=0.0,
            is_mock=False,
        )

    # 2. Embed user query using multilingual sentence transformer
    search_text = message
    if diagnosis_context and diagnosis_context.disease and diagnosis_context.disease.lower() not in message.lower():
        search_text = f"{diagnosis_context.disease} on {diagnosis_context.crop or crop or 'wheat'}: {message}"
    query_vec = await embedder.embed(search_text)

    # 3. Retrieve relevant verified knowledge base chunks from FAISS
    retrieval_res = await retriever.retrieve(
        query_vec,
        crop=crop or (diagnosis_context.crop if diagnosis_context else None),
        language=language.value,
    )

    # 4. Low Retrieval Confidence Check (Safety Threshold)
    if not retrieval_res.is_confident or not retrieval_res.chunks:
        logger.warning(
            f"RAG Pipeline: retrieval confidence ({retrieval_res.top_score:.3f}) below "
            f"threshold ({settings.rag_min_similarity}) — returning safe referral."
        )
        return ChatResponse(
            success=True,
            answer=get_low_confidence_response(language),
            sources=[],
            language=language,
            session_id=session_id,
            escalate=True,
            retrieval_score=round(retrieval_res.top_score, 3),
            is_mock=False,
        )

    # 5. Generate grounded answer via Qwen/DashScope
    chunk_texts = [c.text for c in retrieval_res.chunks]
    answer_text = await generator.generate_answer(
        message=message,
        context_chunks=chunk_texts,
        language=language,
        session_id=session_id,
        crop=crop,
        district=district,
        diagnosis_context=diagnosis_context,
    )

    # 6. Extract structured sources from actual metadata
    sources = [
        SourceItem(
            title=c.source_title,
            source=c.source,
            chunk_id=c.chunk_id,
        )
        for c in retrieval_res.chunks
    ]

    # 7. Escalation Check
    escalate = should_escalate_chat(answer_text)

    return ChatResponse(
        success=True,
        answer=answer_text,
        sources=sources,
        language=language,
        session_id=session_id,
        escalate=escalate,
        retrieval_score=round(retrieval_res.top_score, 3),
        is_mock=settings.advisor_mock_mode,
    )
