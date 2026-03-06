from __future__ import annotations

import enum
import uuid
from datetime import datetime
from pydantic import BaseModel, Field, model_validator


class GenerationContextInputType(str, enum.Enum):
    FILE = "FILE"
    TEXT = "TEXT"
    WEBSITE = "WEBSITE"


class GenerationJobStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class GenerationContextValueRequest(BaseModel):
    input_id: uuid.UUID | None = None
    type: str
    value: str = Field(min_length=1)
    file_name: str | None = None

    @model_validator(mode="after")
    def validate_type(self) -> "GenerationContextValueRequest":
        normalized = self.type.upper()
        if normalized == "URL":
            normalized = "WEBSITE"
        if normalized not in {"FILE", "TEXT", "WEBSITE"}:
            raise ValueError("type must be one of FILE, TEXT, WEBSITE/url")
        self.type = normalized
        return self


class CreateGenerationRequest(BaseModel):
    template_id: uuid.UUID
    title: str = Field(min_length=1, max_length=255)
    context_values: list[GenerationContextValueRequest] = Field(default_factory=list)


class CreateGenerationResponse(BaseModel):
    document_id: uuid.UUID
    job_id: uuid.UUID
    status: GenerationJobStatus


class GenerationJobRead(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    document_id: uuid.UUID
    template_id: uuid.UUID
    requested_by_user_id: uuid.UUID
    status: GenerationJobStatus
    pipeline_version: str
    model_profile: str
    final_markdown: str | None = None
    final_html: str | None = None
    token_usage_json: dict | None
    cost_usd: float
    error_code: str | None
    error_message: str | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime
    updated_at: datetime


class GenerationEventRead(BaseModel):
    id: int
    workspace_id: uuid.UUID
    job_id: uuid.UUID
    event_type: str
    message: str
    payload: dict | None
    created_at: datetime
