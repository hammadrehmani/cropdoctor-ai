"""
AgriGuard AI — Application Configuration
=========================================
Pydantic Settings reads values from environment variables / .env file.
All settings have sensible defaults for local development.
"""
from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────────────
    app_env: Literal["development", "staging", "production"] = "development"
    app_name: str = "AgriGuard AI"
    secret_key: str = "changeme"
    allowed_origins: list[str] | str = ["http://localhost:3000", "http://127.0.0.1:3000"]
    log_level: str = "INFO"

    # ── Database ───────────────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./agriguard.db"

    # ── ML Models ──────────────────────────────────────────────────────────
    model_dir: Path = Path("./ml/models")

    # Phase 1: per-crop weight files (legacy, kept for compat)
    classifier_weights_cotton: str = "efficientnet_b0_cotton.pt"
    classifier_weights_wheat: str = "efficientnet_b0_wheat.pt"
    classifier_weights_rice: str = "efficientnet_b0_rice.pt"
    classifier_weights_sugarcane: str = "efficientnet_b0_sugarcane.pt"

    # Phase 2: unified multi-class checkpoint
    classifier_checkpoint: Path = Path("./ml/models/classifier.pt")
    classifier_classes: Path = Path("./ml/models/classifier_classes.json")

    faiss_index_path: Path = Path("./ml/faiss/agriguard.index")
    faiss_docs_path: Path = Path("./ml/faiss/agriguard_docs.pkl")
    embedding_model: str = "paraphrase-multilingual-MiniLM-L12-v2"
    rag_min_similarity: float = 0.35
    rag_top_k: int = 4
    risk_model_path: Path = Path("./ml/models/risk_model.joblib")

    # ── Dataset ────────────────────────────────────────────────────────────
    dataset_root: Path = Path("../data/raw")
    """Root directory where PlantVillage-style class subdirectories are placed."""

    # ── Inference ──────────────────────────────────────────────────────────
    inference_confidence_threshold: float = 0.50
    """Top-1 confidence below this → InferenceResult.uncertain=True."""

    # ── Severity thresholds ────────────────────────────────────────────────
    severity_threshold_low: float = 5.0
    severity_threshold_moderate: float = 25.0
    severity_threshold_severe: float = 50.0

    # ── Feature Flags ──────────────────────────────────────────────────────
    mock_ml_models: bool = True
    """Global mock flag (Phase 1 compat). Use diagnosis_mock_mode for Phase 2."""

    diagnosis_mock_mode: bool = True
    """
    Phase 2 mock flag for the /analyze endpoint.
    true  → deterministic mock predictions (clearly labelled is_mock=True)
    false → real inference; 503 if checkpoint is missing
    """

    expert_confidence_threshold: float = 0.60
    """Confidence below this → escalate to human expert."""

    advisor_mock_mode: bool = False
    """
    Phase 6 mock flag for the /chat and /advisor endpoint.
    true  → deterministic mock advisory responses (clearly labelled is_mock=True)
    false → real DashScope/Qwen LLM API; returns 503 if API key missing or provider fails
    """

    # ── DashScope / Qwen ───────────────────────────────────────────────────
    dashscope_api_key: str = ""
    dashscope_base_url: str = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
    qwen_model: str = "qwen-turbo"

    # ── Groq LLM ───────────────────────────────────────────────────────────
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_model: str = "qwen/qwen3.8-27b"
    llm_provider: str = "auto"  # "auto", "groq", or "dashscope"

    # ── Open-Meteo ─────────────────────────────────────────────────────────
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"
    open_meteo_forecast_days: int = 7

    # ── Expert Escalation ──────────────────────────────────────────────────
    expert_webhook_url: str = ""

    # ── File Storage ───────────────────────────────────────────────────────
    static_dir: Path = Path("./static")
    max_upload_size_mb: int = 10

    # ── Districts Data ─────────────────────────────────────────────────────
    districts_json_path: Path = Path("../data/districts.json")

    # ── Computed helpers ───────────────────────────────────────────────────
    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",")]
        return v

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    def classifier_weights_for_crop(self, crop: str) -> Path:
        """Return the weight file path for a given crop name."""
        mapping = {
            "cotton": self.classifier_weights_cotton,
            "wheat": self.classifier_weights_wheat,
            "rice": self.classifier_weights_rice,
            "sugarcane": self.classifier_weights_sugarcane,
        }
        filename = mapping.get(crop.lower(), "")
        return self.model_dir / filename


# Singleton — import this throughout the app
settings = Settings()
