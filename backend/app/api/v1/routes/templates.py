from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_workspace
from app.repositories.template_repo import TemplateRepository
from app.schemas.template import (
    TemplateCreateRequest,
    TemplateDuplicateRequest,
    TemplateIconRead,
    TemplateListResponse,
    TemplatePatchRequest,
    TemplateRead,
    TemplateUpdateRequest,
)
from app.services.template_service import ICON_CATALOG, TemplateService

router = APIRouter(prefix="/templates", tags=["templates"])


def _normalize_style(style: str) -> str:
    mapping = {
        "paragraph": "PARAGRAPH",
        "bulleted": "BULLETED_LIST",
        "numbered": "NUMBERED_LIST",
        "table": "TABLE",
        "quote": "QUOTE",
        "highlight": "HIGHLIGHT",
    }
    return mapping.get(style.lower(), style.upper())


def _normalize_input_type(input_type: str) -> str:
    mapping = {
        "url": "WEBSITE",
        "website": "WEBSITE",
        "file": "FILE",
        "text": "TEXT",
    }
    return mapping.get(input_type.lower(), input_type.upper())


def _normalize_sections_payload(sections: list[Any]) -> list[dict]:
    normalized = []
    for s in sections:
        content_instructions = s.content_instructions or s.content
        normalized.append(
            {
                "title": s.title,
                "order_index": s.order_index,
                "content_instructions": content_instructions,
                "allowed_styles": [_normalize_style(st.value if hasattr(st, "value") else st) for st in s.allowed_styles],
                "allow_additional_context": s.allow_additional_context,
                "context_inputs": [
                    {
                        "label": ci.label,
                        "input_type": _normalize_input_type(ci.input_type.value if hasattr(ci.input_type, "value") else ci.input_type),
                        "required": ci.required,
                        "description": ci.description,
                        "allowed_file_types": ci.allowed_file_types,
                        "order_index": ci.order_index,
                    }
                    for ci in s.context_inputs
                ],
            }
        )
    return normalized


def _normalize_context_inputs_payload(inputs: list[Any]) -> list[dict]:
    return [
        {
            "label": ci.label,
            "input_type": _normalize_input_type(ci.input_type.value if hasattr(ci.input_type, "value") else ci.input_type),
            "required": ci.required,
            "description": ci.description,
            "allowed_file_types": ci.allowed_file_types,
            "order_index": ci.order_index,
        }
        for ci in inputs
    ]


@router.get("", response_model=TemplateListResponse)
async def list_templates(
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
    query: str | None = Query(default=None, min_length=1),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> TemplateListResponse:
    svc = TemplateService(TemplateRepository())
    items, total = await svc.list(
        session,
        workspace_id=workspace.id,
        query=query,
        limit=limit,
        offset=offset,
    )
    return TemplateListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/icons", response_model=list[TemplateIconRead])
async def list_template_icons() -> list[TemplateIconRead]:
    return [TemplateIconRead(**item) for item in ICON_CATALOG]


@router.post("", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: TemplateCreateRequest,
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> TemplateRead:
    svc = TemplateService(TemplateRepository())
    sections_payload = _normalize_sections_payload(payload.sections)
    document_context_inputs = _normalize_context_inputs_payload(payload.document_context_inputs)
    try:
        return await svc.create_default(
            session,
            workspace_id=workspace.id,
            name=payload.name,
            description=payload.description,
            icon=payload.icon,
            document_context_inputs=document_context_inputs,
            sections=sections_payload,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{template_id}/duplicate", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
async def duplicate_template(
    template_id: uuid.UUID,
    payload: TemplateDuplicateRequest,
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> TemplateRead:
    svc = TemplateService(TemplateRepository())
    duplicated = await svc.duplicate(
        session,
        template_id=template_id,
        workspace_id=workspace.id,
        name=payload.name,
    )
    if not duplicated:
        raise HTTPException(status_code=404, detail="Template not found")
    return duplicated


@router.patch("/{template_id}", response_model=TemplateRead)
async def patch_template(
    template_id: uuid.UUID,
    payload: TemplatePatchRequest,
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> TemplateRead:
    svc = TemplateService(TemplateRepository())
    try:
        patched = await svc.patch(
            session,
            template_id=template_id,
            workspace_id=workspace.id,
            name=payload.name,
            description=payload.description,
            icon=payload.icon,
            is_active=payload.is_active,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not patched:
        raise HTTPException(status_code=404, detail="Template not found")
    return patched


@router.patch("/{template_id}/icon", response_model=TemplateRead)
async def patch_template_icon(
    template_id: uuid.UUID,
    payload: TemplatePatchRequest,
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> TemplateRead:
    if payload.icon is None:
        raise HTTPException(status_code=400, detail="icon is required")
    svc = TemplateService(TemplateRepository())
    try:
        patched = await svc.patch(
            session,
            template_id=template_id,
            workspace_id=workspace.id,
            icon=payload.icon,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not patched:
        raise HTTPException(status_code=404, detail="Template not found")
    return patched


@router.get("/{template_id}", response_model=TemplateRead)
async def get_template(
    template_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> TemplateRead:
    svc = TemplateService(TemplateRepository())
    tpl = await svc.get_full(session, template_id=template_id, workspace_id=workspace.id)
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    return tpl


@router.put("/{template_id}", response_model=TemplateRead)
async def update_template(
    template_id: uuid.UUID,
    payload: TemplateUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> TemplateRead:
    svc = TemplateService(TemplateRepository())
    try:
        return await svc.replace(
            session,
            template_id=template_id,
            workspace_id=workspace.id,
            payload={
                "name": payload.name,
                "description": payload.description,
                "icon": payload.icon,
                "document_context_inputs": _normalize_context_inputs_payload(payload.document_context_inputs),
                "sections": _normalize_sections_payload(payload.sections),
            },
        )
    except ValueError as e:
        if str(e) == "Template not found":
            raise HTTPException(status_code=404, detail="Template not found")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> None:
    svc = TemplateService(TemplateRepository())
    ok = await svc.soft_delete(session, template_id=template_id, workspace_id=workspace.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Template not found")
