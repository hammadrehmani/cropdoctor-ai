"""
ORM Model — Expert Request
Records cases escalated to human agricultural experts.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ExpertRequest(Base):
    __tablename__ = "expert_requests"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # Source — which service triggered escalation
    source: Mapped[str] = mapped_column(String(20), nullable=False)  # diagnosis | chat

    # Linked records (optional)
    diagnosis_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    chat_session_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    crop: Mapped[str | None] = mapped_column(String(50), nullable=True)
    disease: Mapped[str | None] = mapped_column(String(150), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Farmer's description / question (text, no identifying data)
    context: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status lifecycle: pending → assigned → resolved
    status: Mapped[str] = mapped_column(String(20), default="pending")
    expert_response: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<ExpertRequest id={self.id} status={self.status}>"
