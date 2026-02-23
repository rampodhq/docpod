from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace, WorkspaceType


class WorkspaceRepository:
    async def create(
        self,
        session: AsyncSession,
        *,
        name: str,
        type_: WorkspaceType,
        owner_user_id,
    ) -> Workspace:
        ws = Workspace(name=name, type=type_, owner_user_id=owner_user_id)
        session.add(ws)
        await session.flush()
        return ws

    async def list_for_user(self, session: AsyncSession, user_id) -> list[Workspace]:
        from app.models.membership import WorkspaceMembership

        res = await session.execute(
            select(Workspace)
            .join(WorkspaceMembership, WorkspaceMembership.workspace_id == Workspace.id)
            .where(WorkspaceMembership.user_id == user_id)
            .order_by(Workspace.created_at.desc())
        )
        return list(res.scalars().all())

    async def get_by_id(self, session: AsyncSession, workspace_id) -> Workspace | None:
        res = await session.execute(select(Workspace).where(Workspace.id == workspace_id))
        return res.scalar_one_or_none()