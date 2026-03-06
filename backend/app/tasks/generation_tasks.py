from __future__ import annotations

import asyncio
import json
import logging
import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.config import settings
from app.core.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.models.document import Document, DocumentStatus
from app.models.generation_job import GenerationJob, GenerationJobStatus
from app.models.generation_event import GenerationEvent
from app.models.template_section import TemplateSection

logger = logging.getLogger(__name__)
_worker_loop: asyncio.AbstractEventLoop | None = None


def _normalize_style_name(style: str) -> str:
    mapping = {
        "BULLETED": "BULLETED_LIST",
        "NUMBERED": "NUMBERED_LIST",
    }
    normalized = (style or "").strip().upper()
    return mapping.get(normalized, normalized)


def _build_style_requirements(allowed_styles: list[str]) -> str:
    style_instructions = {
        "PARAGRAPH": "- PARAGRAPH: include at least one normal prose paragraph.",
        "BULLETED_LIST": "- BULLETED_LIST: include a markdown bullet list using `- ` markers.",
        "NUMBERED_LIST": "- NUMBERED_LIST: include a markdown numbered list using `1. ` markers.",
        "TABLE": "- TABLE: include at least one valid markdown table.",
        "QUOTE": "- QUOTE: include at least one markdown block quote using `> `.",
        "HIGHLIGHT": "- HIGHLIGHT: include at least one emphasized callout using `**bold**` text.",
    }
    normalized_styles = []
    for style in allowed_styles:
        normalized = _normalize_style_name(style)
        if normalized and normalized not in normalized_styles:
            normalized_styles.append(normalized)
    lines = [style_instructions[s] for s in normalized_styles if s in style_instructions]
    if not lines:
        return "- PARAGRAPH: include at least one normal prose paragraph."
    return "\n".join(lines)


def _strip_leading_headings(markdown: str) -> str:
    lines = markdown.splitlines()
    idx = 0
    while idx < len(lines):
        current = lines[idx].strip()
        if not current:
            idx += 1
            continue
        if re.match(r"^#{1,6}\s+", current):
            idx += 1
            continue
        break
    return "\n".join(lines[idx:]).strip()


def _safe_document_title(value: str | None) -> str:
    title = (value or "").strip()
    title = re.sub(r"^#+\s*", "", title).strip()
    return title or "Untitled Document"


@celery_app.task(name="generation.run_generation_job")
def run_generation_job(job_id: str) -> None:
    global _worker_loop
    if _worker_loop is None or _worker_loop.is_closed():
        _worker_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(_worker_loop)
    _worker_loop.run_until_complete(_run_generation_job_async(job_id))


async def _run_generation_job_async(job_id: str) -> None:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        logger.error("Invalid job id passed to task: %s", job_id)
        return

    retrieval_service = None
    async with AsyncSessionLocal() as session:
        job_res = await session.execute(select(GenerationJob).where(GenerationJob.id == job_uuid))
        job = job_res.scalar_one_or_none()
        if not job:
            logger.error("Generation job not found: %s", job_id)
            return

        if job.status == GenerationJobStatus.CANCELLED:
            return

        job.status = GenerationJobStatus.RUNNING
        job.started_at = datetime.now(timezone.utc)
        job.updated_at = datetime.now(timezone.utc)
        session.add(
            GenerationEvent(
                workspace_id=job.workspace_id,
                job_id=job.id,
                event_type="JOB_STARTED",
                message="Generation job started",
            )
        )

        doc_res = await session.execute(select(Document).where(Document.id == job.document_id))
        doc = doc_res.scalar_one_or_none()
        if doc:
            doc.status = DocumentStatus.GENERATING
            doc.updated_at = datetime.now(timezone.utc)
        await session.commit()

        try:
            from app.services.llm_service import LLMService
            from app.services.prompt_template_service import PromptTemplateService
            from app.services.retrieval_service import RetrievalService

            sections_res = await session.execute(
                select(TemplateSection)
                .where(TemplateSection.template_id == job.template_id)
                .where(TemplateSection.is_deleted.is_(False))
                .order_by(TemplateSection.order_index.asc())
            )
            sections = list(sections_res.scalars().all())
            if not sections:
                raise ValueError("Template has no sections")

            prompt_service = PromptTemplateService()
            llm_service = LLMService()
            document_title = _safe_document_title((job.input_snapshot or {}).get("title"))
            context_values = (job.input_snapshot or {}).get("context_values", [])
            retrieval_service = RetrievalService()
            ingestion_stats = await retrieval_service.ingest_context_values(
                job_id=job.id,
                context_values=context_values,
            )
            session.add(
                GenerationEvent(
                    workspace_id=job.workspace_id,
                    job_id=job.id,
                    event_type="RETRIEVAL_INDEXED",
                    message="Context indexed in Redis",
                    payload=ingestion_stats,
                )
            )
            await session.commit()

            async def _run_with_limit(section: TemplateSection, sem: asyncio.Semaphore) -> dict:
                async with sem:
                    return await _generate_section(
                        section=section,
                        job_id=job.id,
                        document_title=document_title,
                        prompt_service=prompt_service,
                        llm_service=llm_service,
                        retrieval_service=retrieval_service,
                    )

            sem = asyncio.Semaphore(max(1, settings.generation_section_parallelism))
            tasks = []
            for section in sections:
                tasks.append(
                    asyncio.create_task(
                        _run_with_limit(section, sem)
                    )
                )
            section_results = await asyncio.gather(*tasks)
            section_results.sort(key=lambda item: item["order_index"])

            section_plans = {}
            section_outputs = []
            retrieval_snapshot_sections = {}
            for result in section_results:
                section_id = result["section_id"]
                section_plans[section_id] = result["plan"]
                retrieval_snapshot_sections[section_id] = {
                    "queries": result["queries"],
                    "chunks": result["chunks"],
                }
                section_outputs.append(
                    {
                        "section_id": section_id,
                        "title": result["title"],
                        "order_index": result["order_index"],
                        "markdown": result["markdown"],
                    }
                )
                session.add(
                    GenerationEvent(
                        workspace_id=job.workspace_id,
                        job_id=job.id,
                        event_type="SECTION_COMPLETED",
                        message=f"Section generated: {result['title']}",
                        payload={"section_id": section_id, "order_index": result["order_index"]},
                    )
                )

            final_blocks = [f"# {document_title}"]
            for item in section_outputs:
                section_title = (item["title"] or "").strip() or "Untitled Section"
                section_markdown = (item["markdown"] or "").strip()
                final_blocks.append(f"## {section_title}")
                if section_markdown:
                    final_blocks.append(section_markdown)
            final_markdown = "\n\n".join(final_blocks).strip()

            job.retrieval_snapshot = {"sections": retrieval_snapshot_sections}
            job.plan_json = {"sections": section_plans}
            job.section_outputs = {"sections": section_outputs}
            job.final_markdown = final_markdown
            job.final_html = None
            job.status = GenerationJobStatus.SUCCEEDED
            job.error_code = None
            job.error_message = None
            job.finished_at = datetime.now(timezone.utc)
            job.updated_at = datetime.now(timezone.utc)

            if doc:
                doc.status = DocumentStatus.COMPLETED
                doc.latest_generation_job_id = job.id
                doc.updated_at = datetime.now(timezone.utc)

            session.add(
                GenerationEvent(
                    workspace_id=job.workspace_id,
                    job_id=job.id,
                    event_type="JOB_COMPLETED",
                    message="Generation job completed",
                    payload={"sections": len(section_outputs)},
                )
            )
            await session.commit()
        except Exception as e:
            logger.exception("Generation failed for job %s", job.id)
            job.status = GenerationJobStatus.FAILED
            job.error_code = "GENERATION_FAILED"
            job.error_message = str(e)
            job.finished_at = datetime.now(timezone.utc)
            job.updated_at = datetime.now(timezone.utc)

            if doc:
                doc.status = DocumentStatus.FAILED
                doc.latest_generation_job_id = job.id
                doc.updated_at = datetime.now(timezone.utc)

            session.add(
                GenerationEvent(
                    workspace_id=job.workspace_id,
                    job_id=job.id,
                    event_type="JOB_FAILED",
                    message="Generation job failed",
                    payload={"code": "GENERATION_FAILED", "error": str(e)},
                )
            )
            await session.commit()
        finally:
            if retrieval_service is not None:
                try:
                    await retrieval_service.cleanup_job(job_id=job.id)
                except Exception:
                    logger.exception("Failed to cleanup Redis keys for job %s", job.id)
                await retrieval_service.close()


async def _generate_section(
    *,
    section: TemplateSection,
    job_id: uuid.UUID,
    document_title: str,
    prompt_service,
    llm_service,
    retrieval_service,
) -> dict:
    retrieved = await retrieval_service.retrieve_for_section(
        job_id=job_id,
        section_title=section.title,
        section_instructions=section.content_instructions,
        allowed_styles=section.allowed_styles,
    )
    context_text = retrieved["context_text"]
    normalized_allowed_styles = [_normalize_style_name(style) for style in section.allowed_styles]
    allowed_styles = ", ".join(normalized_allowed_styles)
    section_instructions = section.content_instructions or "No explicit instructions provided."
    style_requirements = _build_style_requirements(section.allowed_styles)
    base_vars = {
        "document_title": document_title,
        "section_title": section.title,
        "section_instructions": section_instructions,
        "allowed_styles": allowed_styles,
        "style_requirements": style_requirements,
        "context_text": context_text,
    }
    plan_system, plan_user = prompt_service.render(
        pipeline_version="v1",
        stage="section_plan",
        variables=base_vars,
    )
    plan_json = await llm_service.generate_json(
        model=settings.llm_model_planner,
        system_prompt=plan_system,
        user_prompt=plan_user,
    )
    draft_system, draft_user = prompt_service.render(
        pipeline_version="v1",
        stage="section_draft",
        variables={**base_vars, "section_plan_json": json.dumps(plan_json, indent=2)},
    )
    markdown = await llm_service.generate_text(
        model=settings.llm_model_writer,
        system_prompt=draft_system,
        user_prompt=draft_user,
    )
    markdown = _strip_leading_headings(markdown)

    return {
        "section_id": str(section.id),
        "title": section.title,
        "order_index": section.order_index,
        "queries": retrieved["queries"],
        "chunks": retrieved["chunks"],
        "plan": plan_json,
        "markdown": markdown,
    }
