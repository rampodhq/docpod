from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session, get_current_user, get_current_workspace
from app.repositories.membership_repo import MembershipRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.schemas.workspace import WorkspaceRead
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("", response_model=list[WorkspaceRead])
async def list_workspaces(
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
) -> list[WorkspaceRead]:
    svc = WorkspaceService(WorkspaceRepository(), MembershipRepository())
    workspaces = await svc.list_for_user(session, user.id)
    return [WorkspaceRead.model_validate(ws) for ws in workspaces]


@router.get("/current", response_model=WorkspaceRead)
async def current_workspace(ws=Depends(get_current_workspace)) -> WorkspaceRead:
    return WorkspaceRead.model_validate(ws)