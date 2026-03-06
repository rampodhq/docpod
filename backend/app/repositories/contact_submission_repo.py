from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contact_submission import ContactSubmission


class ContactSubmissionRepository:
    async def create(
        self,
        session: AsyncSession,
        *,
        name: str,
        email: str,
        workflow: str,
    ) -> ContactSubmission:
        row = ContactSubmission(
            name=name,
            email=email,
            workflow=workflow,
        )
        session.add(row)
        await session.flush()
        return row
