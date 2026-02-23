from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace
from app.repositories.membership_repo import MembershipRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.core.exceptions import WorkspaceAccessError


class WorkspaceService:
    def __init__(self, workspace_repo: WorkspaceRepository, membership_repo: MembershipRepository) -> None:
        self._workspaces = workspace_repo
        self._memberships = membership_repo

    async def list_for_user(self, session: AsyncSession, user_id: uuid.UUID) -> list[Workspace]:
        return await self._workspaces.list_for_user(session, user_id)

    async def require_access(self, session: AsyncSession, *, workspace_id: uuid.UUID, user_id: uuid.UUID) -> Workspace:
        ws = await self._workspaces.get_by_id(session, workspace_id)
        if not ws:
            raise WorkspaceAccessError("Workspace not found")

        membership = await self._memberships.get_membership(session, workspace_id=workspace_id, user_id=user_id)
        if not membership:
            raise WorkspaceAccessError("No access to workspace")

        return ws