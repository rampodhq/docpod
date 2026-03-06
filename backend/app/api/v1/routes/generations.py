from __future__ import annotations

import uuid
import json

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_current_workspace, get_db_session
from app.core.security import decode_access_token
from app.repositories.membership_repo import MembershipRepository
from app.repositories.document_repo import DocumentRepository
from app.repositories.generation_repo import GenerationRepository
from app.repositories.template_repo import TemplateRepository
from app.repositories.user_repo import UserRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.schemas.generation import (
    CreateGenerationRequest,
    CreateGenerationResponse,
    GenerationEventRead,
    GenerationJobRead,
)
from app.services.generation_service import GenerationService

router = APIRouter(prefix="/generations", tags=["generations"])


def _service() -> GenerationService:
    return GenerationService(
        TemplateRepository(),
        DocumentRepository(),
        GenerationRepository(),
    )


async def _resolve_workspace_for_stream(
    *,
    request: Request,
    session: AsyncSession,
    access_token: str | None,
    workspace_id: str | None,
    authorization: str | None,
    x_workspace_id: str | None,
):
    token = access_token
    workspace_str = workspace_id

    if token is None and authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if workspace_str is None:
        workspace_str = x_workspace_id

    if not token:
        raise HTTPException(status_code=401, detail="Missing access token")
    if not workspace_str:
        raise HTTPException(status_code=400, detail="Missing workspace_id")

    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(str(payload.get("sub")))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await UserRepository().get_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    try:
        workspace_uuid = uuid.UUID(workspace_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workspace_id")

    workspace = await WorkspaceRepository().get_by_id(session, workspace_uuid)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    membership = await MembershipRepository().get_membership(
        session,
        workspace_id=workspace_uuid,
        user_id=user.id,
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized for workspace")

    return workspace


@router.post("", response_model=CreateGenerationResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_generation(
    payload: CreateGenerationRequest,
    session: AsyncSession = Depends(get_db_session),
    user=Depends(get_current_user),
    workspace=Depends(get_current_workspace),
) -> CreateGenerationResponse:
    svc = _service()
    try:
        return await svc.create_job(
            session,
            workspace_id=workspace.id,
            user_id=user.id,
            payload=payload,
        )
    except ValueError as e:
        detail = str(e)
        if detail == "Template not found":
            raise HTTPException(status_code=404, detail=detail)
        raise HTTPException(status_code=400, detail=detail)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/{job_id}", response_model=GenerationJobRead)
async def get_generation_job(
    job_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> GenerationJobRead:
    svc = _service()
    row = await svc.get_job(session, workspace_id=workspace.id, job_id=job_id)
    if not row:
        raise HTTPException(status_code=404, detail="Generation job not found")
    return row


@router.get("/{job_id}/events", response_model=list[GenerationEventRead])
async def list_generation_events(
    job_id: uuid.UUID,
    after_id: int | None = Query(default=None, ge=0),
    limit: int = Query(default=200, ge=1, le=1000),
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> list[GenerationEventRead]:
    svc = _service()
    job = await svc.get_job(session, workspace_id=workspace.id, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")
    return await svc.list_events(
        session,
        workspace_id=workspace.id,
        job_id=job_id,
        after_id=after_id,
        limit=limit,
    )


@router.post("/{job_id}/cancel", response_model=GenerationJobRead)
async def cancel_generation_job(
    job_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    workspace=Depends(get_current_workspace),
) -> GenerationJobRead:
    svc = _service()
    row = await svc.cancel_job(session, workspace_id=workspace.id, job_id=job_id)
    if not row:
        raise HTTPException(status_code=404, detail="Generation job not found")
    return row


@router.get("/{job_id}/stream")
async def stream_generation_events(
    job_id: uuid.UUID,
    request: Request,
    access_token: str | None = Query(default=None),
    workspace_id: str | None = Query(default=None),
    after_id: int | None = Query(default=None, ge=0),
    authorization: str | None = Header(default=None, alias="Authorization"),
    x_workspace_id: str | None = Header(default=None, alias="X-Workspace-Id"),
    session: AsyncSession = Depends(get_db_session),
):
    workspace = await _resolve_workspace_for_stream(
        request=request,
        session=session,
        access_token=access_token,
        workspace_id=workspace_id,
        authorization=authorization,
        x_workspace_id=x_workspace_id,
    )
    svc = _service()
    job = await svc.get_job(session, workspace_id=workspace.id, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")

    async def event_gen():
        cursor = after_id
        terminal = {"SUCCEEDED", "FAILED", "CANCELLED"}
        while True:
            if await request.is_disconnected():
                break

            items = await svc.list_events(
                session,
                workspace_id=workspace.id,
                job_id=job_id,
                after_id=cursor,
                limit=200,
            )
            for item in items:
                cursor = item.id
                payload = {
                    "id": item.id,
                    "event_type": item.event_type,
                    "message": item.message,
                    "payload": item.payload,
                    "created_at": item.created_at.isoformat(),
                }
                yield f"id: {item.id}\nevent: {item.event_type}\ndata: {json.dumps(payload)}\n\n"

            latest = await svc.get_job(session, workspace_id=workspace.id, job_id=job_id)
            if latest and latest.status.value in terminal:
                done_payload = {"status": latest.status.value, "job_id": str(job_id)}
                yield f"event: done\ndata: {json.dumps(done_payload)}\n\n"
                break

            yield "event: heartbeat\ndata: {}\n\n"
            await asyncio.sleep(1)

    import asyncio

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
