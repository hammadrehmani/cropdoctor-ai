"""
RAG Service — Agronomic & Chemical Dosage Safety Guardrails (Phase 4)
====================================================================
Detects unsafe chemical/pesticide dosage, mixing ratio, tank concentration,
and unauthorized formulation queries across English, Urdu, and Sindhi.
Enforces strict expert referral rather than generating unsupported chemical rates.
"""
from __future__ import annotations

import re

from app.schemas.chat import Language

# Keywords and regex patterns for dosage/application rate queries
_DOSAGE_PATTERNS_EN = [
    r"\b(?:how much|how many)\s+(?:ml|grams?|g|liters?|l|mg|kg|tablespoons?|drops?)\b",
    r"\b(?:dose|dosage|mixing ratio|tank mix|dilution|application rate|spray rate)\b",
    r"\b(?:ml|grams?|g)\s+per\s+(?:liter|litre|l|gallon|acre|hectare|tank)\b",
    r"\b(?:what quantity|how much pesticide|how much chemical|how much spray)\b",
    r"\b(?:chemical dose|fungicide dose|insecticide dose|spray quantity)\b",
]

_DOSAGE_PATTERNS_UR = [
    r"(?:کتنی|کتنا)\s+(?:دوا|دوائی|سپرے|پیسٹیسائیڈ|ملی لیٹر|گرام|چمچ)",
    r"فی\s+لیٹر\s+(?:کتنی|کتنا|مقدار)",
    r"(?:مقدار|ڈوز|خوراک|تناسب)\s+(?:کیا ہے|کتنی ہے|بتائیں)",
    r"(?:سپرے کی مقدار|کتنا سپرے|کتنی دوائی ڈالوں|ملی لیٹر فی لیٹر)",
]

_DOSAGE_PATTERNS_SD = [
    r"(?:ڪيتري|ڪيترو)\s+(?:دوا|سپرائي|پيسٽي سائيڊ|ملي ليٽر|گرام)",
    r"في\s+لیٽر\s+(?:ڪيتري|ڪيترو|مقدار)",
    r"(?:مقدار|ڊوز|خوراک)\s+(?:ڇا آهي|ڪيتري آهي|ٻڌايو)",
    r"(?:ڪيتري دوا في ليٽر|سپرائي جو مقدار)",
]

_SAFE_DOSAGE_RESPONSES = {
    Language.english: (
        "For safety and crop health, exact chemical spray dosages, tank dilution ratios, "
        "and pesticide application rates cannot be provided automatically. Chemical dosages "
        "depend strictly on the specific commercial formulation, crop growth stage, and "
        "local field conditions. Please consult your local Agricultural Extension Office, "
        "a qualified agronomist, or read the official manufacturer product label registered "
        "in your district."
    ),
    Language.urdu: (
        "فصل اور ماحول کے تحفظ کی خاطر کیمیائی ادویات یا پیسٹیسائیڈز کی قطعی مقدار (ڈوز) اور "
        "فی لیٹر تناسب خودکار طور پر فراہم نہیں کیا جا سکتا۔ ادویات کی درست مقدار تجارتی برانڈ، "
        "فصل کی حالت اور مقامی موسمی حالات پر منحصر ہوتی ہے۔ براہِ کرم اپنے قریبی محکمہ زراعت "
        "(ایگریکلچرل ایکسٹینشن)، مستند زرعی ماہر سے مشورہ کریں یا پروڈکٹ لیبل پر درج ہدایات "
        "پر عمل کریں۔"
    ),
    Language.sindhi: (
        "فصل ۽ ماحول جي حفاظت لاءِ ڪيميائي دوائن يا پيسٽي سائيڊز جو حتمي مقدار (ڊوز) يا في ليٽر "
        "تناسب پاڻمرادو نٿو ڏئي سگهجي. دوائن جو صحيح مقدار پراڊڪٽ جي برانڊ، فصل جي واڌاري ۽ مقامي "
        "حالتن تي دارومدار رکي ٿو. مهرباني ڪري پنهنجي مقامي زراعت کاتي (ايڪسٽينشن آفيسر) يا زرعی "
        "ماهر سان رابطو ڪريو يا منظور ٿيل پراڊڪٽ ليبل پڙهو."
    ),
}

_LOW_CONFIDENCE_RESPONSES = {
    Language.english: (
        "I don't have enough verified agricultural information in my knowledge base to answer "
        "this query safely. Please consult your local agricultural extension expert or agronomist."
    ),
    Language.urdu: (
        "میرے پاس اس سوال کا محفوظ جواب دینے کے لیے کافی تصدیق شدہ زرعی معلومات موجود نہیں ہیں۔ "
        "براہِ کرم زرعی ماہر یا محکمہ زراعت کے فیلڈ عملے سے مشورہ کریں۔"
    ),
    Language.sindhi: (
        "منهنجي ذخيري ۾ هن سوال جو محفوظ جواب ڏيڻ لاءِ ڪافي تصديق ٿيل زرعي معلومات موجود ناهي. "
        "مهرباني ڪري مقامي زرعي ماهر سان رابطو ڪريو."
    ),
}


def is_chemical_dosage_query(message: str) -> bool:
    """Detect if the query asks for specific chemical/pesticide dosage or mixing rates."""
    lower_msg = message.lower()

    # Check English patterns
    for pat in _DOSAGE_PATTERNS_EN:
        if re.search(pat, lower_msg, re.IGNORECASE):
            return True

    # Check Urdu patterns
    for pat in _DOSAGE_PATTERNS_UR:
        if re.search(pat, message):
            return True

    # Check Sindhi patterns
    for pat in _DOSAGE_PATTERNS_SD:
        if re.search(pat, message):
            return True

    return False


def get_safe_dosage_response(language: Language) -> str:
    """Return verified safe escalation response for chemical dosage queries."""
    return _SAFE_DOSAGE_RESPONSES.get(language, _SAFE_DOSAGE_RESPONSES[Language.english])


def get_low_confidence_response(language: Language) -> str:
    """Return verified safe fallback when retrieval confidence is below threshold."""
    return _LOW_CONFIDENCE_RESPONSES.get(language, _LOW_CONFIDENCE_RESPONSES[Language.english])
