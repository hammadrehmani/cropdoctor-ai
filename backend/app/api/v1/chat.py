"""API route — Multilingual RAG Chat & Advisor."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag.pipeline import answer

router = APIRouter(tags=["advisor", "chat"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Ask agricultural questions in English, Urdu, or Sindhi",
)
@router.post(
    "/advisor",
    response_model=ChatResponse,
    summary="AI Agricultural Advisor endpoint (alias to /chat)",
)
async def advisor_chat(request: ChatRequest) -> ChatResponse:
    """
    Accepts an agricultural query in English (en), Urdu (ur), or Sindhi (sd).
    Supports optional conversation session_id and diagnosis context.
    Retrieves relevant knowledge from the agricultural RAG index and generates
    safe, farmer-friendly guidance via Qwen.
    """
    return await answer(
        message=request.message,
        language=request.language,
        crop=request.crop,
        district=request.district,
        session_id=request.session_id or "",
        diagnosis_context=request.diagnosis_context,
    )
