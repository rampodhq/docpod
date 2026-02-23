from __future__ import annotations

import uuid
from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.template_repo import TemplateRepository
from app.schemas.template import TemplateRead, TemplateSummaryRead

ICON_CATALOG = [
    {"key": "DocumentText", "label": "Document"},
    {"key": "Clipboard", "label": "Checklist"},
    {"key": "Briefcase", "label": "Business"},
    {"key": "ChartBar", "label": "Analytics"},
    {"key": "Pencil", "label": "Writing"},
    {"key": "Settings", "label": "Operations"},
]
ICON_KEYS = {item["key"] for item in ICON_CATALOG}


class TemplateService:
    def __init__(self, repo: TemplateRepository) -> None:
        self._repo = repo

    async def create_default(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        name: str | None,
        description: str | None,
        icon: str | None,
        sections: list[dict] | None = None,
    ) -> TemplateRead:
        self._validate_icon(icon)
        tpl = await self._repo.create_scoped(
            session,
            workspace_id=workspace_id,
            name=name or "Untitled Template",
            description=description,
            icon=icon,
            sections_payload=sections,
        )
        await session.commit()
        full = await self._repo.get_full_scoped(session, template_id=tpl.id, workspace_id=workspace_id)
        assert full is not None
        return self._to_read(*full)

    async def get_full(
        self,
        session: AsyncSession,
        *,
        template_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> TemplateRead | None:
        full = await self._repo.get_full_scoped(session, template_id=template_id, workspace_id=workspace_id)
        if not full:
            return None
        return self._to_read(*full)

    async def replace(
        self,
        session: AsyncSession,
        *,
        template_id: uuid.UUID,
        workspace_id: uuid.UUID,
        payload: dict,
    ) -> TemplateRead:
        self._validate_icon(payload.get("icon"))
        tpl = await self._repo.replace_content_scoped(
            session,
            template_id=template_id,
            workspace_id=workspace_id,
            name=payload["name"],
            description=payload.get("description"),
            icon=payload.get("icon"),
            sections_payload=payload["sections"],
        )
        await session.commit()
        full = await self._repo.get_full_scoped(session, template_id=tpl.id, workspace_id=workspace_id)
        assert full is not None
        return self._to_read(*full)

    async def list(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        query: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[TemplateSummaryRead], int]:
        items = await self._repo.list_scoped(
            session,
            workspace_id=workspace_id,
            query=query,
            limit=limit,
            offset=offset,
        )
        total = await self._repo.count_scoped(session, workspace_id=workspace_id, query=query)
        out = [
            TemplateSummaryRead(
                id=tpl.id,
                workspace_id=tpl.workspace_id,
                name=tpl.name,
                description=tpl.description,
                icon=tpl.icon,
                is_active=tpl.is_active,
                created_at=tpl.created_at,
                updated_at=tpl.updated_at,
                section_count=section_count,
            )
            for tpl, section_count in items
        ]
        return out, total

    async def patch(
        self,
        session: AsyncSession,
        *,
        template_id: uuid.UUID,
        workspace_id: uuid.UUID,
        name: str | None = None,
        description: str | None = None,
        icon: str | None = None,
        is_active: bool | None = None,
    ) -> TemplateRead | None:
        self._validate_icon(icon)
        tpl = await self._repo.patch_metadata_scoped(
            session,
            template_id=template_id,
            workspace_id=workspace_id,
            name=name,
            description=description,
            icon=icon,
            is_active=is_active,
        )
        if not tpl:
            return None
        await session.commit()
        full = await self._repo.get_full_scoped(session, template_id=tpl.id, workspace_id=workspace_id)
        assert full is not None
        return self._to_read(*full)

    async def duplicate(
        self,
        session: AsyncSession,
        *,
        template_id: uuid.UUID,
        workspace_id: uuid.UUID,
        name: str | None = None,
    ) -> TemplateRead | None:
        tpl = await self._repo.duplicate_scoped(
            session,
            template_id=template_id,
            workspace_id=workspace_id,
            name=name,
        )
        if not tpl:
            return None
        await session.commit()
        full = await self._repo.get_full_scoped(session, template_id=tpl.id, workspace_id=workspace_id)
        assert full is not None
        return self._to_read(*full)

    async def soft_delete(
        self,
        session: AsyncSession,
        *,
        template_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> bool:
        ok = await self._repo.soft_delete_scoped(session, template_id=template_id, workspace_id=workspace_id)
        if ok:
            await session.commit()
        return ok

    def _to_read(self, tpl, sections, inputs) -> TemplateRead:
        inputs_by_section = defaultdict(list)
        for i in inputs:
            inputs_by_section[i.section_id].append(i)

        section_reads = []
        for s in sections:
            ctx_reads = [
                {
                    "id": ci.id,
                    "label": ci.label,
                    "input_type": ci.input_type.value,
                    "required": ci.required,
                    "description": ci.description,
                    "allowed_file_types": ci.allowed_file_types,
                    "order_index": ci.order_index,
                }
                for ci in inputs_by_section.get(s.id, [])
            ]

            section_reads.append(
                {
                    "id": s.id,
                    "title": s.title,
                    "order_index": s.order_index,
                    "content_instructions": s.content_instructions,
                    "allowed_styles": [style.upper() for style in s.allowed_styles],
                    "allow_additional_context": s.allow_additional_context,
                    "context_inputs": ctx_reads,
                }
            )

        return TemplateRead.model_validate(
            {
                "id": tpl.id,
                "workspace_id": tpl.workspace_id,
                "name": tpl.name,
                "description": tpl.description,
                "icon": tpl.icon,
                "is_active": tpl.is_active,
                "created_at": tpl.created_at,
                "updated_at": tpl.updated_at,
                "sections": section_reads,
            }
        )

    def _validate_icon(self, icon: str | None) -> None:
        if icon and icon not in ICON_KEYS:
            raise ValueError(f"Unsupported icon '{icon}'")
