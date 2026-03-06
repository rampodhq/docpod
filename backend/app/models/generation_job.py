from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class GenerationJobStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=False)
    requested_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    status: Mapped[GenerationJobStatus] = mapped_column(
        Enum(GenerationJobStatus, name="generation_job_status"),
        default=GenerationJobStatus.QUEUED,
        nullable=False,
    )
    pipeline_version: Mapped[str] = mapped_column(String(50), nullable=False, default="v1")
    model_profile: Mapped[str] = mapped_column(String(50), nullable=False, default="balanced_v1")

    input_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    retrieval_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    plan_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    section_outputs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    final_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    final_html: Mapped[str | None] = mapped_column(Text, nullable=True)

    token_usage_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    cost_usd: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False, default=Decimal("0"))

    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
