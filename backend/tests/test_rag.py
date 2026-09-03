"""
Tests — Phase 4 Multilingual RAG Agricultural Advisor & Safety Layer.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.config import settings
from app.schemas.chat import Language
from app.services.rag import embedder, retriever
from app.services.rag.pipeline import answer
from app.services.rag.safety import is_chemical_dosage_query


@pytest.mark.asyncio
async def test_embedder_returns_384_dim_vector() -> None:
    """Verify sentence embedder returns 384-dimensional vector."""
    vec = await embedder.embed("Wheat leaf rust symptoms and prevention")
    assert isinstance(vec, list)
    assert len(vec) == 384
    # Non-zero when model is loaded
    if not settings.mock_ml_models:
        assert any(v != 0.0 for v in vec)


@pytest.mark.asyncio
async def test_retriever_english_query() -> None:
    """Verify English query retrieves relevant knowledge chunks."""
    vec = await embedder.embed("How to control wheat leaf rust?")
    res = await retriever.retrieve(vec, crop="wheat", language="en", top_k=3)
    assert len(res.chunks) > 0
    assert 0.0 <= res.top_score <= 1.0
    for chunk in res.chunks:
        assert chunk.crop == "wheat"
        assert chunk.source_title
        assert chunk.source


@pytest.mark.asyncio
async def test_retriever_urdu_query() -> None:
    """Verify Urdu query retrieves relevant knowledge chunks."""
    vec = await embedder.embed("گندم میں کنگی کی علامات کیا ہیں؟")
    res = await retriever.retrieve(vec, crop="wheat", language="ur", top_k=3)
    assert len(res.chunks) > 0
    assert res.top_score > 0.0
    # Top chunk should contain wheat rust context
    assert any(c.crop == "wheat" for c in res.chunks)


@pytest.mark.asyncio
async def test_retriever_sindhi_query() -> None:
    """Verify Sindhi query retrieves relevant knowledge chunks."""
    vec = await embedder.embed("ڪڻڪ ۾ رتي جو علاج ڪيئن ڪجي؟")
    res = await retriever.retrieve(vec, crop="wheat", language="sd", top_k=3)
    assert len(res.chunks) > 0
    assert res.top_score > 0.0


@pytest.mark.asyncio
async def test_retriever_crop_filtering() -> None:
    """Verify crop filter restricts results to specified crop."""
    vec = await embedder.embed("Disease symptoms and whitefly management")
    res = await retriever.retrieve(vec, crop="cotton", top_k=3)
    assert len(res.chunks) > 0
    for chunk in res.chunks:
        assert chunk.crop == "cotton"


@pytest.mark.asyncio
async def test_chemical_dosage_detection_multilingual() -> None:
    """Verify safety guardrail intercepts dosage queries in English, Urdu, and Sindhi."""
    # English queries
    assert is_chemical_dosage_query("How many ml per liter of fungicide should I spray?") is True
    assert is_chemical_dosage_query("What is the exact dose of tebuconazole?") is True
    assert is_chemical_dosage_query("What is the mixing ratio for wheat spray?") is True
    assert is_chemical_dosage_query("What are the general symptoms of rust?") is False

    # Urdu queries
    assert is_chemical_dosage_query("کتنی دوا فی لیٹر ڈالوں؟") is True
    assert is_chemical_dosage_query("سپرے کی مقدار کتنی ہے؟") is True
    assert is_chemical_dosage_query("گندم کی بیماری کے بارے میں بتائیں") is False

    # Sindhi queries
    assert is_chemical_dosage_query("ڪيتري دوا في ليٽر وجهان؟") is True
    assert is_chemical_dosage_query("سپرائي جو مقدار ڇا آهي؟") is True
    assert is_chemical_dosage_query("ڪپهه جي واڌاري بابت ٻڌايو") is False


@pytest.mark.asyncio
async def test_pipeline_escalates_on_chemical_dosage_query() -> None:
    """Pipeline intercepts dosage queries and provides extension referral without dosage numbers."""
    resp = await answer(
        message="What is the exact dosage of pesticide per acre?",
        language=Language.english,
        crop="wheat",
    )
    assert resp.escalate is True
    assert "Agricultural Extension" in resp.answer or "product label" in resp.answer
    assert "ml" not in resp.answer.lower() or "cannot be provided" in resp.answer.lower()
    assert len(resp.sources) == 0


@pytest.mark.asyncio
async def test_pipeline_low_similarity_triggers_safe_fallback() -> None:
    """Low retrieval similarity triggers safe referral without hallucination."""
    low_res = retriever.RetrievalResult(chunks=[], top_score=0.18, is_confident=False)
    with patch("app.services.rag.pipeline.retriever.retrieve", new_callable=AsyncMock, return_value=low_res):
        resp = await answer(
            message="How do I repair a broken laptop motherboard and configure DNS?",
            language=Language.english,
        )
        assert resp.escalate is True
        assert "verified agricultural information" in resp.answer.lower() or "consult" in resp.answer.lower()
        assert resp.retrieval_score == 0.18
        assert len(resp.sources) == 0


@pytest.mark.asyncio
async def test_pipeline_with_mocked_qwen_generation() -> None:
    """Verify grounded answer generation and source metadata mapping with mocked LLM."""
    mock_llm_reply = (
        "Wheat Leaf Rust is caused by Puccinia triticina. Maintain balanced fertilization and "
        "inspect fields weekly. Consult your local extension officer for verified treatments."
    )

    with patch("app.services.rag.generator.settings.dashscope_api_key", "sk-mock-key"):
        with patch("app.services.rag.generator.settings.advisor_mock_mode", False):
            with patch("openai.resources.chat.completions.AsyncCompletions.create", new_callable=AsyncMock) as mock_create:
                mock_choice = AsyncMock()
                mock_choice.message.content = mock_llm_reply
                mock_res = AsyncMock()
                mock_res.choices = [mock_choice]
                mock_create.return_value = mock_res

                resp = await answer(
                    message="What are symptoms and management of wheat rust?",
                    language=Language.english,
                    crop="wheat",
                )

                assert resp.success is True
                assert resp.answer == mock_llm_reply
                assert len(resp.sources) > 0
                assert resp.sources[0].title
                assert resp.sources[0].source
                assert resp.retrieval_score > 0.0


@pytest.mark.asyncio
async def test_chat_endpoint_returns_503_when_unconfigured(client: AsyncClient) -> None:
    """POST /api/v1/chat returns 503 when DashScope API key is unconfigured."""
    original_mock = settings.advisor_mock_mode
    original_key = settings.dashscope_api_key
    try:
        settings.advisor_mock_mode = False
        settings.dashscope_api_key = ""
        payload = {
            "message": "What is brown rust?",
            "language": "en",
            "crop": "wheat",
        }
        resp = await client.post("/api/v1/chat", json=payload)
        assert resp.status_code == 503
        assert "DashScope API key is not configured" in resp.json()["detail"]
    finally:
        settings.advisor_mock_mode = original_mock
        settings.dashscope_api_key = original_key


@pytest.mark.asyncio
async def test_sources_contain_authentic_institutional_metadata() -> None:
    """Verify retrieved sources match verified institutional sources from knowledge base."""
    vec = await embedder.embed("Cotton leaf curl virus whitefly management")
    res = await retriever.retrieve(vec, crop="cotton", top_k=2)
    assert len(res.chunks) > 0
    valid_institutions = ["Central Cotton Research Institute", "CCRI", "FAO", "Agriculture Extension", "Department", "PARC", "NARC"]
    for c in res.chunks:
        assert any(inst in c.source for inst in valid_institutions)
