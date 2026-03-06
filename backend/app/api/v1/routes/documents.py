from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_workspace, get_db_session
from app.repositories.document_repo import DocumentRepository
from app.repositories.generation_repo import GenerationRepository
from app.repositories.template_repo import TemplateRepository
from app.schemas.document import DocumentContentRead, DocumentListResponse, DocumentRead
from app.services.generation_service import GenerationService

router = APIRouter(prefix="/documents", tags=["documents"])


def _service() -> GenerationService:
    return GenerationService(
        TemplateRepository(),
        DocumentRepository(),
        GenerationRepository(),
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> DocumentListResponse:
    svc = _service()
    items, total = await svc.list_documents(
        session,
        workspace_id=workspace.id,
        limit=limit,
        offset=offset,
    )
    return DocumentListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(
    document_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> DocumentRead:
    svc = _service()
    row = await svc.get_document(
        session,
        workspace_id=workspace.id,
        document_id=document_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    return row


@router.get("/{document_id}/content", response_model=DocumentContentRead)
async def get_document_content(
    document_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> DocumentContentRead:
    svc = _service()
    row = await svc.get_document_content(
        session,
        workspace_id=workspace.id,
        document_id=document_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    return row


@router.get("/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    format: str = Query(default="md"),
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
):
    svc = _service()
    try:
        content, filename, mime_type = await svc.export_document(
            session,
            workspace_id=workspace.id,
            document_id=document_id,
            export_format=format,
        )
    except ValueError as e:
        detail = str(e)
        if detail == "Document not found":
            raise HTTPException(status_code=404, detail=detail)
        raise HTTPException(status_code=400, detail=detail)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return Response(
        content=content,
        media_type=mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
