from __future__ import annotations

import enum
import uuid
from datetime import datetime
from pydantic import BaseModel


class DocumentStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    GENERATING = "GENERATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class DocumentRead(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    template_id: uuid.UUID
    created_by_user_id: uuid.UUID
    title: str
    status: DocumentStatus
    latest_generation_job_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    items: list[DocumentRead]
    total: int
    limit: int
    offset: int


class DocumentContentRead(BaseModel):
    document_id: uuid.UUID
    job_id: uuid.UUID | None
    status: DocumentStatus
    content_markdown: str | None
