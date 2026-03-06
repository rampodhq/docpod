from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.template import Template
from app.models.template_section import TemplateSection
from app.models.template_context_input import TemplateContextInput, ContextInputType


class TemplateRepository:
    async def create_scoped(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        name: str,
        description: str | None,
        icon: str | None,
        document_context_inputs_payload: list[dict] | None = None,
        sections_payload: list[dict] | None = None,
    ) -> Template:
        tpl = Template(
            workspace_id=workspace_id,
            name=name,
            description=description,
            icon=icon,
        )
        session.add(tpl)
        await session.flush()

        if document_context_inputs_payload:
            for ci in document_context_inputs_payload:
                input_type = ContextInputType(ci["input_type"])
                allowed_file_types = ci.get("allowed_file_types")
                if input_type != ContextInputType.FILE:
                    allowed_file_types = None

                inp = TemplateContextInput(
                    template_id=tpl.id,
                    section_id=None,
                    label=ci["label"],
                    input_type=input_type,
                    required=ci["required"],
                    description=ci.get("description"),
                    allowed_file_types=allowed_file_types,
                    order_index=ci["order_index"],
                )
                session.add(inp)

        if sections_payload:
            for sec in sections_payload:
                s = TemplateSection(
                    template_id=tpl.id,
                    title=sec["title"],
                    order_index=sec["order_index"],
                    content_instructions=sec.get("content_instructions"),
                    allowed_styles=sec["allowed_styles"],
                    allow_additional_context=sec.get("allow_additional_context", True),
                )
                session.add(s)
                await session.flush()

                for ci in sec.get("context_inputs", []):
                    input_type = ContextInputType(ci["input_type"])
                    allowed_file_types = ci.get("allowed_file_types")
                    if input_type != ContextInputType.FILE:
                        allowed_file_types = None

                    inp = TemplateContextInput(
                        template_id=tpl.id,
                        section_id=s.id,
                        label=ci["label"],
                        input_type=input_type,
                        required=ci["required"],
                        description=ci.get("description"),
                        allowed_file_types=allowed_file_types,
                        order_index=ci["order_index"],
                    )
                    session.add(inp)
        else:
            section = TemplateSection(
                template_id=tpl.id,
                title="New Section",
                order_index=1,
                content_instructions=None,
                allowed_styles=["PARAGRAPH"],
                allow_additional_context=True,
            )
            session.add(section)
            await session.flush()

        return tpl

    async def list_scoped(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        query: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[tuple[Template, int]]:
        stmt = (
            select(Template, func.count(TemplateSection.id))
            .select_from(Template)
            .outerjoin(
                TemplateSection,
                (TemplateSection.template_id == Template.id) & (TemplateSection.is_deleted.is_(False)),
            )
            .where(Template.workspace_id == workspace_id)
            .where(Template.is_deleted.is_(False))
            .group_by(Template.id)
            .order_by(Template.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if query:
            q = f"%{query.strip()}%"
            stmt = stmt.where((Template.name.ilike(q)) | (Template.description.ilike(q)))

        res = await session.execute(stmt)
        return [(row[0], int(row[1] or 0)) for row in res.all()]

    async def count_scoped(
        self,
        session: AsyncSession,
        *,
        workspace_id: uuid.UUID,
        query: str | None = None,
    ) -> int:
        stmt = (
            select(func.count(Template.id))
            .where(Template.workspace_id == workspace_id)
            .where(Template.is_deleted.is_(False))
        )
        if query:
            q = f"%{query.strip()}%"
            stmt = stmt.where((Template.name.ilike(q)) | (Template.description.ilike(q)))
        res = await session.execute(stmt)
        return int(res.scalar_one() or 0)

    async def get_by_id_scoped(
        self,
        session: AsyncSession,
        *,
        template_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> Template | None:
        res = await session.execute(
            select(Template)
            .where(Template.id == template_id)
            .where(Template.workspace_id == workspace_id)
            .where(Template.is_deleted.is_(False))
        )
        return res.scalar_one_or_none()

    async def get_full_scoped(
        self,
        session: AsyncSession,
        *,
        template_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> tuple[Template, list[TemplateSection], list[TemplateContextInput]] | None:
        tpl = await self.get_by_id_scoped(session, template_id=template_id, workspace_id=workspace_id)
        if not tpl:
            return None

        sections_res = await session.execute(
            select(TemplateSection)
            .where(TemplateSection.template_id == tpl.id)
            .where(TemplateSection.is_deleted.is_(False))
            .order_by(TemplateSection.order_index.asc())
        )
        sections = list(sections_res.scalars().all())

        section_ids = [s.id for s in sections]
        if section_ids:
            inputs_stmt = (
                select(TemplateContextInput)
                .where(TemplateContextInput.template_id == tpl.id)
                .where(TemplateContextInput.is_deleted.is_(False))
                .order_by(TemplateContextInput.section_id.asc(), TemplateContextInput.order_index.asc())
            )
        else:
            inputs_stmt = (
                select(TemplateContextInput)
                .where(TemplateContextInput.template_id == tpl.id)
                .where(TemplateContextInput.is_deleted.is_(False))
                .order_by(TemplateContextInput.order_index.asc())
            )

        inputs_res = await session.execute(inputs_stmt)
        inputs = list(inputs_res.scalars().all())
        return tpl, sections, inputs

    async def soft_delete_scoped(
        self,
        session: AsyncSession,
        *,
        template_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> bool:
        now = datetime.now(timezone.utc)

        tpl = await self.get_by_id_scoped(session, template_id=template_id, workspace_id=workspace_id)
        if not tpl:
            return False

        tpl.is_deleted = True
        tpl.deleted_at = now

        await session.execute(
            update(TemplateSection)
            .where(TemplateSection.template_id == tpl.id)
            .where(TemplateSection.is_deleted.is_(False))
            .values(is_deleted=True, deleted_at=now)
        )

        await session.execute(
            update(TemplateContextInput)
            .where(TemplateContextInput.template_id == tpl.id)
            .where(TemplateContextInput.is_deleted.is_(False))
            .values(is_deleted=True, deleted_at=now)
        )

        return True

    async def replace_content_scoped(
        self,
        session: AsyncSession,
        *,
        template_id: uuid.UUID,
        workspace_id: uuid.UUID,
        name: str,
        description: str | None,
        icon: str | None,
        document_context_inputs_payload: list[dict] | None,
        sections_payload: list[dict],
    ) -> Template:
        tpl = await self.get_by_id_scoped(session, template_id=template_id, workspace_id=workspace_id)
        if not tpl:
            raise ValueError("Template not found")

        tpl.name = name
        tpl.description = description
        tpl.icon = icon

        # remove existing sections + inputs to avoid unique conflicts on (template_id, order_index)
        # during full template replacement
        existing_full = await self.get_full_scoped(session, template_id=template_id, workspace_id=workspace_id)
        _, existing_sections, existing_inputs = existing_full or (tpl, [], [])

        if existing_inputs:
            await session.execute(delete(TemplateContextInput).where(TemplateContextInput.template_id == tpl.id))
        if existing_sections:
            section_ids = [s.id for s in existing_sections]
            await session.execute(delete(TemplateSection).where(TemplateSection.id.in_(section_ids)))

        # insert new document-level context inputs
        for ci in (document_context_inputs_payload or []):
            allowed_file_types = ci.get("allowed_file_types")
            input_type = ContextInputType(ci["input_type"])
            if input_type != ContextInputType.FILE:
                allowed_file_types = None

            inp = TemplateContextInput(
                template_id=tpl.id,
                section_id=None,
                label=ci["label"],
                input_type=input_type,
                required=ci["required"],
                description=ci.get("description"),
                allowed_file_types=allowed_file_types,
                order_index=ci["order_index"],
            )
            session.add(inp)

        # insert new sections + section-level context inputs
        for sec in sections_payload:
            s = TemplateSection(
                template_id=tpl.id,
                title=sec["title"],
                order_index=sec["order_index"],
                content_instructions=sec.get("content_instructions"),
                allowed_styles=sec["allowed_styles"],
                allow_additional_context=sec["allow_additional_context"],
            )
            session.add(s)
            await session.flush()

            for ci in sec["context_inputs"]:
                allowed_file_types = ci.get("allowed_file_types")
                input_type = ContextInputType(ci["input_type"])
                if input_type != ContextInputType.FILE:
                    allowed_file_types = None

                inp = TemplateContextInput(
                    template_id=tpl.id,
                    section_id=s.id,
                    label=ci["label"],
                    input_type=input_type,
                    required=ci["required"],
                    description=ci.get("description"),
                    allowed_file_types=allowed_file_types,
                    order_index=ci["order_index"],
                )
                session.add(inp)

        await session.flush()
        return tpl

    async def patch_metadata_scoped(
        self,
        session: AsyncSession,
        *,
        template_id: uuid.UUID,
        workspace_id: uuid.UUID,
        name: str | None = None,
        description: str | None = None,
        icon: str | None = None,
        is_active: bool | None = None,
    ) -> Template | None:
        tpl = await self.get_by_id_scoped(session, template_id=template_id, workspace_id=workspace_id)
        if not tpl:
            return None

        if name is not None:
            tpl.name = name
        if description is not None:
            tpl.description = description
        if icon is not None:
            tpl.icon = icon
        if is_active is not None:
            tpl.is_active = is_active

        await session.flush()
        return tpl

    async def duplicate_scoped(
        self,
        session: AsyncSession,
        *,
        template_id: uuid.UUID,
        workspace_id: uuid.UUID,
        name: str | None = None,
    ) -> Template | None:
        full = await self.get_full_scoped(session, template_id=template_id, workspace_id=workspace_id)
        if not full:
            return None
        tpl, sections, inputs = full

        new_tpl = Template(
            workspace_id=workspace_id,
            name=name or f"{tpl.name} (Copy)",
            description=tpl.description,
            icon=tpl.icon,
            is_active=tpl.is_active,
        )
        session.add(new_tpl)
        await session.flush()

        input_by_section: dict[uuid.UUID, list[TemplateContextInput]] = {}
        document_inputs: list[TemplateContextInput] = []
        for ci in inputs:
            if ci.section_id is None:
                document_inputs.append(ci)
            else:
                input_by_section.setdefault(ci.section_id, []).append(ci)

        for ci in sorted(document_inputs, key=lambda x: x.order_index):
            new_inp = TemplateContextInput(
                template_id=new_tpl.id,
                section_id=None,
                label=ci.label,
                input_type=ci.input_type,
                required=ci.required,
                description=ci.description,
                allowed_file_types=ci.allowed_file_types,
                order_index=ci.order_index,
            )
            session.add(new_inp)

        for sec in sections:
            new_sec = TemplateSection(
                template_id=new_tpl.id,
                title=sec.title,
                order_index=sec.order_index,
                content_instructions=sec.content_instructions,
                allowed_styles=sec.allowed_styles,
                allow_additional_context=sec.allow_additional_context,
            )
            session.add(new_sec)
            await session.flush()

            for ci in input_by_section.get(sec.id, []):
                new_inp = TemplateContextInput(
                    template_id=new_tpl.id,
                    section_id=new_sec.id,
                    label=ci.label,
                    input_type=ci.input_type,
                    required=ci.required,
                    description=ci.description,
                    allowed_file_types=ci.allowed_file_types,
                    order_index=ci.order_index,
                )
                session.add(new_inp)

        await session.flush()
        return new_tpl
