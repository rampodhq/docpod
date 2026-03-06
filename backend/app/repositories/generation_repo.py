from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.generation_event import GenerationEvent
from app.models.generation_job import GenerationJob, GenerationJobStatus


class GenerationRepository:
    async def create_job_scoped(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        document_id: uuid.UUID,
        template_id: uuid.UUID,
        requested_by_user_id: uuid.UUID,
        input_snapshot: dict,
        pipeline_version: str = "v1",
        model_profile: str = "balanced_v1",
    ) -> GenerationJob:
        job = GenerationJob(
            workspace_id=workspace_id,
            document_id=document_id,
            template_id=template_id,
            requested_by_user_id=requested_by_user_id,
            status=GenerationJobStatus.QUEUED,
            pipeline_version=pipeline_version,
            model_profile=model_profile,
            input_snapshot=input_snapshot,
            cost_usd=Decimal("0"),
        )
        session.add(job)
        await session.flush()
        return job

    async def get_job_scoped(
        self,
        session: AsyncSession,
        *,
        job_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> GenerationJob | None:
        res = await session.execute(
            select(GenerationJob)
            .where(GenerationJob.id == job_id)
            .where(GenerationJob.workspace_id == workspace_id)
        )
        return res.scalar_one_or_none()

    async def set_job_status(
        self,
        session: AsyncSession,
        *,
        job_id: uuid.UUID,
        workspace_id: uuid.UUID,
        status: GenerationJobStatus,
        error_code: str | None = None,
        error_message: str | None = None,
    ) -> GenerationJob | None:
        job = await self.get_job_scoped(session, job_id=job_id, workspace_id=workspace_id)
        if not job:
            return None

        job.status = status
        if status == GenerationJobStatus.RUNNING and job.started_at is None:
            job.started_at = datetime.now(timezone.utc)
        if status in {GenerationJobStatus.SUCCEEDED, GenerationJobStatus.FAILED, GenerationJobStatus.CANCELLED}:
            job.finished_at = datetime.now(timezone.utc)
        if error_code is not None:
            job.error_code = error_code
        if error_message is not None:
            job.error_message = error_message
        job.updated_at = datetime.now(timezone.utc)
        await session.flush()
        return job

    async def add_event(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        job_id: uuid.UUID,
        event_type: str,
        message: str,
        payload: dict | None = None,
    ) -> GenerationEvent:
        event = GenerationEvent(
            workspace_id=workspace_id,
            job_id=job_id,
            event_type=event_type,
            message=message,
            payload=payload,
        )
        session.add(event)
        await session.flush()
        return event

    async def list_events_scoped(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        job_id: uuid.UUID,
        after_id: int | None = None,
        limit: int = 200,
    ) -> list[GenerationEvent]:
        stmt = (
            select(GenerationEvent)
            .where(GenerationEvent.workspace_id == workspace_id)
            .where(GenerationEvent.job_id == job_id)
            .order_by(GenerationEvent.id.asc())
            .limit(limit)
        )
        if after_id is not None:
            stmt = stmt.where(GenerationEvent.id > after_id)
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def get_job_by_id_any_workspace(
        self,
        session: AsyncSession,
        *,
        job_id: uuid.UUID,
    ) -> GenerationJob | None:
        res = await session.execute(select(GenerationJob).where(GenerationJob.id == job_id))
        return res.scalar_one_or_none()
