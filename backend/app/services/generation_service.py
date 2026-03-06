from __future__ import annotations

import re
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import DocumentStatus
from app.models.generation_job import GenerationJobStatus
from app.repositories.document_repo import DocumentRepository
from app.repositories.generation_repo import GenerationRepository
from app.repositories.template_repo import TemplateRepository
from app.schemas.document import DocumentRead
from app.schemas.document import DocumentContentRead
from app.schemas.generation import (
    CreateGenerationRequest,
    CreateGenerationResponse,
    GenerationEventRead,
    GenerationJobRead,
)
from app.services.document_export_service import DocumentExportService
from app.tasks.generation_tasks import run_generation_job


class GenerationService:
    def __init__(
        self,
        template_repo: TemplateRepository,
        document_repo: DocumentRepository,
        generation_repo: GenerationRepository,
    ) -> None:
        self._template_repo = template_repo
        self._document_repo = document_repo
        self._generation_repo = generation_repo
        self._export_service = DocumentExportService()

    async def create_job(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        payload: CreateGenerationRequest,
    ) -> CreateGenerationResponse:
        full = await self._template_repo.get_full_scoped(
            session,
            template_id=payload.template_id,
            workspace_id=workspace_id,
        )
        if not full:
            raise ValueError("Template not found")
        _, sections, inputs = full

        valid_input_ids = {ci.id for ci in inputs}
        required_input_ids = {ci.id for ci in inputs if ci.required}
        provided_input_ids = {v.input_id for v in payload.context_values if v.input_id is not None}
        unknown_input_ids = sorted(str(i) for i in provided_input_ids - valid_input_ids)
        if unknown_input_ids:
            raise ValueError(f"Unknown context inputs provided: {', '.join(unknown_input_ids)}")
        missing_required = sorted(str(i) for i in required_input_ids - provided_input_ids)
        if missing_required:
            raise ValueError(f"Missing required context inputs: {', '.join(missing_required)}")

        section_ids = {s.id for s in sections}
        for ci in inputs:
            if ci.section_id is not None and ci.section_id not in section_ids:
                raise ValueError("Template section mismatch")

        input_snapshot = {
            "template_id": str(payload.template_id),
            "title": payload.title,
            "context_values": [
                {
                    "input_id": str(v.input_id) if v.input_id else None,
                    "type": "WEBSITE" if v.type.upper() == "URL" else v.type.upper(),
                    "value": v.value,
                    "file_name": v.file_name,
                }
                for v in payload.context_values
            ],
        }

        document = await self._document_repo.create_scoped(
            session,
            workspace_id=workspace_id,
            template_id=payload.template_id,
            created_by_user_id=user_id,
            title=payload.title,
        )
        job = await self._generation_repo.create_job_scoped(
            session,
            workspace_id=workspace_id,
            document_id=document.id,
            template_id=payload.template_id,
            requested_by_user_id=user_id,
            input_snapshot=input_snapshot,
        )
        await self._document_repo.set_status(
            session,
            document_id=document.id,
            workspace_id=workspace_id,
            status=DocumentStatus.QUEUED,
            latest_generation_job_id=job.id,
        )
        await self._generation_repo.add_event(
            session,
            workspace_id=workspace_id,
            job_id=job.id,
            event_type="JOB_QUEUED",
            message="Generation job queued",
        )
        await session.commit()

        try:
            run_generation_job.apply_async(args=[str(job.id)], ignore_result=True)
        except Exception as e:
            await self._generation_repo.set_job_status(
                session,
                job_id=job.id,
                workspace_id=workspace_id,
                status=GenerationJobStatus.FAILED,
                error_code="QUEUE_UNAVAILABLE",
                error_message="Failed to enqueue generation task",
            )
            await self._document_repo.set_status(
                session,
                document_id=document.id,
                workspace_id=workspace_id,
                status=DocumentStatus.FAILED,
                latest_generation_job_id=job.id,
            )
            await self._generation_repo.add_event(
                session,
                workspace_id=workspace_id,
                job_id=job.id,
                event_type="JOB_FAILED",
                message="Queue unavailable while enqueueing task",
                payload={"code": "QUEUE_UNAVAILABLE"},
            )
            await session.commit()
            raise RuntimeError("Queue unavailable") from e

        return CreateGenerationResponse(
            document_id=document.id,
            job_id=job.id,
            status=GenerationJobStatus.QUEUED,
        )

    async def get_job(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        job_id: uuid.UUID,
    ) -> GenerationJobRead | None:
        job = await self._generation_repo.get_job_scoped(session, job_id=job_id, workspace_id=workspace_id)
        if not job:
            return None
        return GenerationJobRead.model_validate(
            {
                "id": job.id,
                "workspace_id": job.workspace_id,
                "document_id": job.document_id,
                "template_id": job.template_id,
                "requested_by_user_id": job.requested_by_user_id,
                "status": job.status.value,
                "pipeline_version": job.pipeline_version,
                "model_profile": job.model_profile,
                "final_markdown": job.final_markdown,
                "final_html": job.final_html,
                "token_usage_json": job.token_usage_json,
                "cost_usd": float(job.cost_usd or 0),
                "error_code": job.error_code,
                "error_message": job.error_message,
                "started_at": job.started_at,
                "finished_at": job.finished_at,
                "created_at": job.created_at,
                "updated_at": job.updated_at,
            }
        )

    async def list_events(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        job_id: uuid.UUID,
        after_id: int | None,
        limit: int,
    ) -> list[GenerationEventRead]:
        rows = await self._generation_repo.list_events_scoped(
            session,
            workspace_id=workspace_id,
            job_id=job_id,
            after_id=after_id,
            limit=limit,
        )
        return [
            GenerationEventRead.model_validate(
                {
                    "id": e.id,
                    "workspace_id": e.workspace_id,
                    "job_id": e.job_id,
                    "event_type": e.event_type,
                    "message": e.message,
                    "payload": e.payload,
                    "created_at": e.created_at,
                }
            )
            for e in rows
        ]

    async def cancel_job(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        job_id: uuid.UUID,
    ) -> GenerationJobRead | None:
        job = await self._generation_repo.set_job_status(
            session,
            job_id=job_id,
            workspace_id=workspace_id,
            status=GenerationJobStatus.CANCELLED,
            error_code="CANCELLED_BY_USER",
            error_message="Cancelled by user",
        )
        if not job:
            return None
        await self._document_repo.set_status(
            session,
            document_id=job.document_id,
            workspace_id=workspace_id,
            status=DocumentStatus.CANCELLED,
            latest_generation_job_id=job.id,
        )
        await self._generation_repo.add_event(
            session,
            workspace_id=workspace_id,
            job_id=job.id,
            event_type="JOB_CANCELLED",
            message="Generation job cancelled",
        )
        await session.commit()
        return await self.get_job(session, workspace_id=workspace_id, job_id=job_id)

    async def list_documents(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        limit: int,
        offset: int,
    ) -> tuple[list[DocumentRead], int]:
        rows = await self._document_repo.list_scoped(
            session,
            workspace_id=workspace_id,
            limit=limit,
            offset=offset,
        )
        total = await self._document_repo.count_scoped(session, workspace_id=workspace_id)
        docs = [
            DocumentRead.model_validate(
                {
                    "id": d.id,
                    "workspace_id": d.workspace_id,
                    "template_id": d.template_id,
                    "created_by_user_id": d.created_by_user_id,
                    "title": d.title,
                    "status": d.status.value,
                    "latest_generation_job_id": d.latest_generation_job_id,
                    "created_at": d.created_at,
                    "updated_at": d.updated_at,
                }
            )
            for d in rows
        ]
        return docs, total

    async def get_document(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        document_id: uuid.UUID,
    ) -> DocumentRead | None:
        d = await self._document_repo.get_by_id_scoped(
            session,
            document_id=document_id,
            workspace_id=workspace_id,
        )
        if not d:
            return None
        return DocumentRead.model_validate(
            {
                "id": d.id,
                "workspace_id": d.workspace_id,
                "template_id": d.template_id,
                "created_by_user_id": d.created_by_user_id,
                "title": d.title,
                "status": d.status.value,
                "latest_generation_job_id": d.latest_generation_job_id,
                "created_at": d.created_at,
                "updated_at": d.updated_at,
            }
        )

    async def get_document_content(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        document_id: uuid.UUID,
    ) -> DocumentContentRead | None:
        d = await self._document_repo.get_by_id_scoped(
            session,
            document_id=document_id,
            workspace_id=workspace_id,
        )
        if not d:
            return None

        content = None
        job_id = d.latest_generation_job_id
        if job_id is not None:
            job = await self._generation_repo.get_job_scoped(
                session,
                job_id=job_id,
                workspace_id=workspace_id,
            )
            if job:
                content = job.final_markdown

        return DocumentContentRead(
            document_id=d.id,
            job_id=job_id,
            status=d.status.value,
            content_markdown=content,
        )

    async def export_document(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        document_id: uuid.UUID,
        export_format: str,
    ) -> tuple[bytes, str, str]:
        d = await self._document_repo.get_by_id_scoped(
            session,
            document_id=document_id,
            workspace_id=workspace_id,
        )
        if not d:
            raise ValueError("Document not found")

        content = None
        if d.latest_generation_job_id is not None:
            job = await self._generation_repo.get_job_scoped(
                session,
                job_id=d.latest_generation_job_id,
                workspace_id=workspace_id,
            )
            if job:
                content = job.final_markdown

        if not content:
            raise ValueError("No generated content available for export")

        artifact_bytes, mime_type, ext = self._export_service.render(
            title=d.title,
            markdown=content,
            format_name=export_format,
        )
        file_slug = re.sub(r"[^a-zA-Z0-9._-]+", "_", d.title.strip()) or f"document_{d.id}"
        filename = f"{file_slug}.{ext}"
        return artifact_bytes, filename, mime_type
