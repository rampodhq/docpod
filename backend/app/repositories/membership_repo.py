from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.membership import WorkspaceMembership, WorkspaceRole


class MembershipRepository:
    async def create(
        self,
        session: AsyncSession,
        *,
        workspace_id,
        user_id,
        role: WorkspaceRole,
    ) -> WorkspaceMembership:
        membership = WorkspaceMembership(workspace_id=workspace_id, user_id=user_id, role=role)
        session.add(membership)
        await session.flush()
        return membership

    async def get_membership(self, session: AsyncSession, *, workspace_id, user_id) -> WorkspaceMembership | None:
        res = await session.execute(
            select(WorkspaceMembership)
            .where(WorkspaceMembership.workspace_id == workspace_id)
            .where(WorkspaceMembership.user_id == user_id)
        )
        return res.scalar_one_or_none()