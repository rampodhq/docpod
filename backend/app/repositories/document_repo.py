from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentStatus


class DocumentRepository:
    async def create_scoped(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        template_id: uuid.UUID,
        created_by_user_id: uuid.UUID,
        title: str,
    ) -> Document:
        doc = Document(
            workspace_id=workspace_id,
            template_id=template_id,
            created_by_user_id=created_by_user_id,
            title=title,
            status=DocumentStatus.QUEUED,
        )
        session.add(doc)
        await session.flush()
        return doc

    async def list_scoped(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Document]:
        res = await session.execute(
            select(Document)
            .where(Document.workspace_id == workspace_id)
            .where(Document.is_deleted.is_(False))
            .order_by(Document.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(res.scalars().all())

    async def count_scoped(self, session: AsyncSession, *, workspace_id: uuid.UUID) -> int:
        res = await session.execute(
            select(func.count(Document.id))
            .where(Document.workspace_id == workspace_id)
            .where(Document.is_deleted.is_(False))
        )
        return int(res.scalar_one() or 0)

    async def get_by_id_scoped(
        self,
        session: AsyncSession,
        *,
        document_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> Document | None:
        res = await session.execute(
            select(Document)
            .where(Document.id == document_id)
            .where(Document.workspace_id == workspace_id)
            .where(Document.is_deleted.is_(False))
        )
        return res.scalar_one_or_none()

    async def set_status(
        self,
        session: AsyncSession,
        *,
        document_id: uuid.UUID,
        workspace_id: uuid.UUID,
        status: DocumentStatus,
        latest_generation_job_id: uuid.UUID | None = None,
    ) -> None:
        doc = await self.get_by_id_scoped(session, document_id=document_id, workspace_id=workspace_id)
        if not doc:
            return
        doc.status = status
        doc.latest_generation_job_id = latest_generation_job_id
        doc.updated_at = datetime.now(timezone.utc)
        await session.flush()
