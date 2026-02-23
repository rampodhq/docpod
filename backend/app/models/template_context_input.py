from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Text, String
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ContextInputType(str, enum.Enum):
    FILE = "FILE"
    TEXT = "TEXT"
    WEBSITE = "WEBSITE"


class TemplateContextInput(Base):
    __tablename__ = "template_context_inputs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    section_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("template_sections.id"), nullable=False)

    label: Mapped[str] = mapped_column(String(255), nullable=False)
    input_type: Mapped[ContextInputType] = mapped_column(Enum(ContextInputType, name="context_input_type"), nullable=False)

    required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    allowed_file_types: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)

    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )