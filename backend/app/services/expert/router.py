"""
Expert Routing Service
========================
Determines whether a diagnosis or chat response should be
escalated to a human agricultural expert based on confidence threshold.
"""
from __future__ import annotations

import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Keywords that signal uncertain answers in any supported language
_UNCERTAINTY_SIGNALS = [
    "not sure", "uncertain", "unclear", "cannot determine",
    "یقین نہیں", "واضح نہیں",          # Urdu
    "يقين نه",  "واضح نه",              # Sindhi
]


def should_escalate_diagnosis(confidence: float) -> bool:
    """
    Return True if diagnosis confidence is below the expert routing threshold.

    Args:
        confidence: Model confidence score (0.0 – 1.0).
    """
    should = confidence < settings.expert_confidence_threshold
    if should:
        logger.info(
            f"Expert escalation triggered: confidence={confidence:.2f} "
            f"< threshold={settings.expert_confidence_threshold}"
        )
    return should


def should_escalate_chat(answer_text: str) -> bool:
    """
    Return True if the generated answer signals uncertainty.

    Scans for language-agnostic uncertainty phrases.
    """
    lower = answer_text.lower()
    for signal in _UNCERTAINTY_SIGNALS:
        if signal.lower() in lower:
            logger.info(f"Expert escalation triggered: uncertainty signal '{signal}' found.")
            return True
    return False
