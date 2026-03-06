from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.repositories.contact_submission_repo import ContactSubmissionRepository
from app.schemas.contact import ContactRequest, ContactResponse

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactResponse, status_code=status.HTTP_200_OK)
async def create_contact(
    payload: ContactRequest,
    session: AsyncSession = Depends(get_session),
) -> ContactResponse:
    repo = ContactSubmissionRepository()
    await repo.create(
        session,
        name=payload.name.strip(),
        email=str(payload.email).strip(),
        workflow=payload.workflow.strip(),
    )
    await session.commit()
    return ContactResponse(message="Contact request submitted")
