from __future__ import annotations

import enum
import uuid
from datetime import datetime
from pydantic import BaseModel, Field, model_validator


class TemplateStyle(str, enum.Enum):
    PARAGRAPH = "PARAGRAPH"
    BULLETED_LIST = "BULLETED_LIST"
    NUMBERED_LIST = "NUMBERED_LIST"
    TABLE = "TABLE"
    QUOTE = "QUOTE"
    HIGHLIGHT = "HIGHLIGHT"


class ContextInputType(str, enum.Enum):
    FILE = "FILE"
    TEXT = "TEXT"
    WEBSITE = "WEBSITE"


class TemplateCreateRequest(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = None
    icon: str | None = Field(default=None, max_length=100)
    document_context_inputs: list["TemplateContextInputUpsert"] = Field(default_factory=list)
    sections: list["TemplateSectionUpsert"] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_unique_order(self) -> "TemplateCreateRequest":
        section_orders = [s.order_index for s in self.sections]
        if len(section_orders) != len(set(section_orders)):
            raise ValueError("section order_index must be unique within template")

        doc_input_orders = [i.order_index for i in self.document_context_inputs]
        if len(doc_input_orders) != len(set(doc_input_orders)):
            raise ValueError("document context input order_index must be unique")

        for s in self.sections:
            input_orders = [i.order_index for i in s.context_inputs]
            if len(input_orders) != len(set(input_orders)):
                raise ValueError("context input order_index must be unique within section")
        return self


class TemplateContextInputUpsert(BaseModel):
    label: str = Field(min_length=1, max_length=255)
    input_type: str
    required: bool = False
    description: str | None = None
    allowed_file_types: list[str] | None = None
    order_index: int = Field(ge=1)

    @model_validator(mode="after")
    def validate_file_types(self) -> "TemplateContextInputUpsert":
        normalized_input = self.input_type.upper()
        if normalized_input == "URL":
            normalized_input = "WEBSITE"
        if normalized_input not in {"FILE", "TEXT", "WEBSITE"}:
            raise ValueError("input_type must be one of FILE, TEXT, WEBSITE/url")
        if normalized_input != "FILE" and self.allowed_file_types is not None:
            raise ValueError("allowed_file_types is only valid for FILE input_type")
        return self


class TemplateSectionUpsert(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    order_index: int = Field(ge=1)
    content_instructions: str | None = None
    content: str | None = None  # frontend alias; mapped to content_instructions
    allowed_styles: list[str] = Field(default_factory=lambda: ["PARAGRAPH"])
    allow_additional_context: bool = True
    context_inputs: list[TemplateContextInputUpsert] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_styles(self) -> "TemplateSectionUpsert":
        allowed = {
            "PARAGRAPH",
            "BULLETED_LIST",
            "NUMBERED_LIST",
            "TABLE",
            "QUOTE",
            "HIGHLIGHT",
            "BULLETED",
            "NUMBERED",
            "paragraph",
            "bulleted_list",
            "numbered_list",
            "table",
            "quote",
            "highlight",
            "bulleted",
            "numbered",
        }
        if not self.allowed_styles:
            raise ValueError("allowed_styles cannot be empty")
        for style in self.allowed_styles:
            if style not in allowed:
                raise ValueError(f"unsupported style '{style}'")
        return self


class TemplateUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    icon: str | None = Field(default=None, max_length=100)
    document_context_inputs: list[TemplateContextInputUpsert] = Field(default_factory=list)
    sections: list[TemplateSectionUpsert] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_unique_order(self) -> "TemplateUpdateRequest":
        section_orders = [s.order_index for s in self.sections]
        if len(section_orders) != len(set(section_orders)):
            raise ValueError("section order_index must be unique within template")

        doc_input_orders = [i.order_index for i in self.document_context_inputs]
        if len(doc_input_orders) != len(set(doc_input_orders)):
            raise ValueError("document context input order_index must be unique")

        for s in self.sections:
            input_orders = [i.order_index for i in s.context_inputs]
            if len(input_orders) != len(set(input_orders)):
                raise ValueError("context input order_index must be unique within section")
        return self


class TemplateContextInputRead(BaseModel):
    id: uuid.UUID
    label: str
    input_type: str
    required: bool
    description: str | None
    allowed_file_types: list[str] | None
    order_index: int

    class Config:
        from_attributes = True


class TemplateSectionRead(BaseModel):
    id: uuid.UUID
    title: str
    order_index: int
    content_instructions: str | None
    allowed_styles: list[str]
    allow_additional_context: bool
    context_inputs: list[TemplateContextInputRead]

    class Config:
        from_attributes = True


class TemplateRead(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: str | None
    icon: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    document_context_inputs: list[TemplateContextInputRead] = Field(default_factory=list)
    sections: list[TemplateSectionRead]

    class Config:
        from_attributes = True


class TemplateSummaryRead(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: str | None
    icon: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    section_count: int = 0


class TemplateListResponse(BaseModel):
    items: list[TemplateSummaryRead]
    total: int
    limit: int
    offset: int


class TemplateIconRead(BaseModel):
    key: str
    label: str


class TemplatePatchRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    icon: str | None = Field(default=None, max_length=100)
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_any(self) -> "TemplatePatchRequest":
        if (
            self.name is None
            and self.description is None
            and self.icon is None
            and self.is_active is None
        ):
            raise ValueError("At least one field must be provided")
        return self


class TemplateDuplicateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
