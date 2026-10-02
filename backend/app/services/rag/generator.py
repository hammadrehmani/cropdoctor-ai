"""
RAG Service — Generator (Phase 4)
=================================
Calls Qwen via DashScope using the OpenAI-compatible client.
Enforces grounded system prompts, context isolation, multilingual responses (en, ur, sd),
and strict 503 safety handling when unconfigured.
"""
from __future__ import annotations

import logging
from collections import defaultdict
from typing import TYPE_CHECKING

from fastapi import HTTPException

from app.config import settings
from app.schemas.chat import Language

if TYPE_CHECKING:
    from app.schemas.chat import DiagnosisContext

logger = logging.getLogger(__name__)

# Sliding window session history: session_id -> list of message dicts
_MAX_HISTORY_MESSAGES = 6
_session_histories: dict[str, list[dict[str, str]]] = defaultdict(list)

_GROUNDED_SYSTEM_PROMPTS = {
    Language.english: (
        "You are CropDoctor AI, an AI-powered plant disease & pest identification system and trusted agricultural advisor for Pakistani farmers.\n\n"
        "STRICT GROUNDING & SAFETY INSTRUCTIONS:\n"
        "1. Answer ONLY from the provided VERIFIED KNOWLEDGE BASE CONTEXT below.\n"
        "2. Do NOT invent diseases, symptoms, chemical brand names, or unverified claims.\n"
        "3. Do NOT provide exact chemical dosages, tank dilution ratios, or mixing quantities. "
        "Direct farmers to follow the registered product label and consult local agronomists.\n"
        "4. If the provided context does not contain sufficient information, "
        "clearly state that you do not have enough verified information and recommend consulting "
        "an agricultural extension officer.\n"
        "5. Clearly distinguish AI guidance from laboratory diagnosis.\n"
        "6. Respond clearly, concisely, and farmer-friendly in English."
    ),
    Language.urdu: (
        "آپ کراپ ڈاکٹر AI (CropDoctor AI) ہیں، سمارٹ فارمنگ اور پودوں کی بیماریوں و کیڑوں کی شناخت کے لیے ایک مستند زرعی مشیر۔\n\n"
        "سخت زرعی اور حفاظتی ہدایات:\n"
        "1. صرف نیچے دیے گئے 'تصدیق شدہ زرعی مواد' کی بنیاد پر جواب دیں۔\n"
        "2. اپنی طرف سے کوئی بیماری، علامات یا غیر مصدقہ دعویٰ مت گھڑیں۔\n"
        "3. کیمیائی ادویات کی قطعی مقدار (ڈوز) یا فی لیٹر تناسب خود سے ہرگز مت بتائیں۔ "
        "کسان کو محکمہ زراعت کی منظور شدہ لیبل ہدایات اور فیلڈ آفیسر سے رجوع کرنے کا کہیں۔\n"
        "4. اگر دیے گئے مواد میں سوال کا واضح جواب موجود نہ ہو تو صاف بتائیں کہ معلومات "
        "کافی نہیں ہیں اور زرعی ماہر سے مشورہ کرنے کا کہیں۔\n"
        "5. جواب آسان، عام فہم اور مختصر اردو میں دیں۔"
    ),
    Language.sindhi: (
        "توهان ڪراپ ڊاڪٽر AI (CropDoctor AI) آهيو، سمارٽ فارمنگ ۽ ٻوٽن جي بيمارين و جيتن جي سڃاڻپ لاءِ هڪ قابل اعتماد زرعي صلاحڪار.\n\n"
        "سخت زرعي ۽ حفاظتي اصول:\n"
        "1. صرف هيٺ ڏنل 'تصديق ٿيل زرعي معلومات' جي بنياد تي جواب ڏيو.\n"
        "2. پاڻ کان ڪا به بيماري، علامت يا غير تصديق ٿيل ڳالهه نه ٺاهيو.\n"
        "3. ڪيميائي دوائن جو حتمي مقدار (ڊوز) يا في ليٽر تناسب نه ٻڌايو. "
        "هارين کي زرعي ماهر سان مشوري ۽ پراڊڪٽ ليبل پڙهڻ جي هدايت ڪريو.\n"
        "4. جيڪڏهن مواد ۾ گهربل معلومات موجود نه هجي ته صاف چئو ته معلومات ناڪافي آهي "
        "۽ زرعي آفيسر سان رابطو ڪريو.\n"
        "5. جواب صاف، سادو ۽ مختصر سنڌي ٻوليءَ ۾ ڏيو."
    ),
}

_MOCK_GROUNDED_ANSWERS = {
    Language.english: (
        "Based on verified agricultural guidelines, monitor your crop regularly and ensure proper "
        "field drainage. For fungal symptoms, remove heavily affected leaves and use only products "
        "registered for your crop while strictly following label directions. Please consult your "
        "local agricultural extension officer for field verification."
    ),
    Language.urdu: (
        "تصدیق شدہ زرعی رہنمائی کے مطابق، فصل کا باقاعدگی سے معائنہ کریں اور پانی کی مناسب نکاسی "
        "یقینی بنائیں۔ فنگل علامات پر پتے تلف کریں اور صرف منظور شدہ ادویات لیبل کے مطابق استعمال "
        "کریں۔ مزید تصدیق کے لیے محکمہ زراعت کے فیلڈ عملے سے رابطہ کریں۔"
    ),
    Language.sindhi: (
        "تصديق ٿيل زرعي رهنمائي موجب، فصل جو باقاعدگيءَ سان معائنو ڪريو ۽ پاڻي جي نيڪال جو بندوبست "
        "رکو. ڦپھوند جي علامتن تي متاثر پن تلف ڪريو ۽ رڳو رجسٽرڊ دوائون ليبل موجب استعمال ڪريو. "
        "وڌيڪ تصديق لاءِ مقامي زرعي آفيسر سان رابطو ڪريو."
    ),
}


def clear_session_history(session_id: str) -> None:
    """Clear conversation history for a given session."""
    if session_id in _session_histories:
        del _session_histories[session_id]


async def generate_answer(
    message: str,
    context_chunks: list[str],
    language: Language,
    session_id: str = "",
    crop: str | None = None,
    district: str | None = None,
    diagnosis_context: DiagnosisContext | None = None,
) -> str:
    """
    Generate a grounded answer using Qwen via DashScope with multi-turn session history.
    """
    # 1. Mock Mode Check (Phase 1 compat only)
    if settings.advisor_mock_mode:
        logger.info("Generator: ADVISOR_MOCK_MODE=true — returning structured grounded stub.")
        stub_answer = _MOCK_GROUNDED_ANSWERS.get(language, _MOCK_GROUNDED_ANSWERS[Language.english])
        if session_id:
            history = _session_histories[session_id]
            history.append({"role": "user", "content": message})
            history.append({"role": "assistant", "content": stub_answer})
            if len(history) > _MAX_HISTORY_MESSAGES:
                _session_histories[session_id] = history[-_MAX_HISTORY_MESSAGES:]
        return stub_answer

    # 2. Real Mode: verify API key presence
    groq_key = settings.groq_api_key.strip() if settings.groq_api_key else ""
    dashscope_key = settings.dashscope_api_key.strip() if settings.dashscope_api_key else ""

    # Determine provider
    use_groq = False
    if settings.llm_provider.lower() == "groq":
        use_groq = True
    elif settings.llm_provider.lower() == "dashscope":
        use_groq = False
    elif groq_key and (not dashscope_key or dashscope_key == "sk-your-dashscope-api-key-here"):
        use_groq = True
    elif groq_key:
        use_groq = True

    if use_groq:
        api_key = groq_key
        base_url = settings.groq_base_url
        model = settings.groq_model
        provider_name = "Groq"
    else:
        api_key = dashscope_key
        base_url = settings.dashscope_base_url
        model = settings.qwen_model
        provider_name = "DashScope"

    if not api_key or api_key in ("sk-your-dashscope-api-key-here", "gsk_your_groq_api_key_here"):
        logger.error(
            f"Generator: real advisor mode is enabled but {provider_name} API key is not configured."
        )
        detail_msg = "AI Advisor is temporarily unavailable. DashScope API key is not configured." if not use_groq else "AI Advisor is temporarily unavailable. Groq API key is not configured."
        raise HTTPException(
            status_code=503,
            detail=detail_msg,
        )

    # 3. Build diagnosis context header if provided
    diag_info_str = ""
    if diagnosis_context and diagnosis_context.disease:
        conf_str = (
            f"{diagnosis_context.confidence * 100:.1f}%"
            if diagnosis_context.confidence is not None
            else "N/A"
        )
        sev_str = (
            f"{diagnosis_context.severity_tier} ({diagnosis_context.affected_percentage}%)"
            if diagnosis_context.severity_tier
            else "N/A"
        )
        diag_info_str = (
            f"\n[Active Diagnosis Context: Crop={diagnosis_context.crop or crop or 'Unknown'}, "
            f"Disease={diagnosis_context.disease}, AI Confidence={conf_str}, "
            f"Estimated Severity={sev_str}]\n"
        )

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
        )

        context_text = (
            "\n\n---\n\n".join(context_chunks)
            if context_chunks
            else "No specific knowledge base articles found."
        )
        system_prompt = _GROUNDED_SYSTEM_PROMPTS.get(
            language, _GROUNDED_SYSTEM_PROMPTS[Language.english]
        )

        meta_info = []
        if crop:
            meta_info.append(f"Crop: {crop}")
        if district:
            meta_info.append(f"District: {district}")
        meta_str = f"[{', '.join(meta_info)}]\n" if meta_info else ""

        messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]

        # Inject session history
        if session_id and session_id in _session_histories:
            for hist_msg in _session_histories[session_id]:
                messages.append(hist_msg)

        # Current grounded prompt
        current_content = (
            f"--- VERIFIED KNOWLEDGE BASE CONTEXT ---\n"
            f"{context_text}\n"
            f"--- END OF CONTEXT ---\n\n"
            f"{diag_info_str}"
            f"{meta_str}"
            f"Farmer Question: {message}\n\n"
            f"Please answer strictly based on the verified context above in {language.value}."
        )
        messages.append({"role": "user", "content": current_content})

        req_max_tokens = 350 if use_groq else 512
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=req_max_tokens,
            temperature=0.2,
        )
        assistant_reply = response.choices[0].message.content or ""

        # Update session history
        if session_id:
            history = _session_histories[session_id]
            history.append({"role": "user", "content": message})
            history.append({"role": "assistant", "content": assistant_reply})
            if len(history) > _MAX_HISTORY_MESSAGES:
                _session_histories[session_id] = history[-_MAX_HISTORY_MESSAGES:]

        return assistant_reply

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"{provider_name} API call failed: {exc}")
        raise HTTPException(
            status_code=503,
            detail="AI Advisor is temporarily unavailable. Please try again later.",
        ) from exc
