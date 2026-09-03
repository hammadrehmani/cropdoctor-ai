"""
ORM Model — Diagnosis
Records each leaf image diagnosis result (anonymised).
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    crop: Mapped[str] = mapped_column(String(50), nullable=False)
    disease: Mapped[str] = mapped_column(String(150), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    severity_pct: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)  # LOW|MEDIUM|HIGH|CRITICAL
    gradcam_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Privacy — only district name is stored; raw GPS is NEVER persisted
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Anonymous Device ID for isolated history retrieval without authentication
    device_id: Mapped[str | None] = mapped_column(
        String(64),
        index=True,
        nullable=True,
    )

    escalated: Mapped[bool] = mapped_column(default=False)
    uncertain: Mapped[bool] = mapped_column(default=False)
    is_mock: Mapped[bool] = mapped_column(default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<Diagnosis id={self.id} crop={self.crop} disease={self.disease}>"
