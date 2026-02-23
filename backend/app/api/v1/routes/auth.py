from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session, get_current_user
from app.core.config import settings
from app.repositories.membership_repo import MembershipRepository
from app.repositories.user_repo import UserRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.auth_service import AuthService
from app.services.storage_service import StorageService
from app.core.exceptions import AuthError

router = APIRouter(prefix="/auth", tags=["auth"])


def _to_user_read(*, user, request: Request) -> UserRead:
    image_url = f"{request.base_url}media/{user.image_path}" if user.image_path else None
    return UserRead(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        account_type=user.account_type,
        organization_name=user.organization_name,
        image_url=image_url,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    account_type: str = Form(...),
    organization_name: str | None = Form(default=None),
    image: UploadFile | None = File(default=None),
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    image_path = None
    if image:
        if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise HTTPException(status_code=400, detail="Only JPG, PNG, and WEBP are supported")
        storage = StorageService(settings.shared_storage_path)
        image_path = await storage.save_profile_image(image)

    svc = AuthService(UserRepository(), WorkspaceRepository(), MembershipRepository())
    try:
        res = await svc.signup(
            session,
            name=name.strip(),
            email=email.lower().strip(),
            password=password,
            account_type=account_type.strip(),
            organization_name=organization_name.strip() if organization_name else None,
            image_path=image_path,
        )
        return TokenResponse(access_token=res.access_token)
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_session)):

    svc = AuthService(
        UserRepository(),
        WorkspaceRepository(),
        MembershipRepository(),
    )

    try:
        res = await svc.login(
            session,
            email=str(payload.email).lower(),
            password=payload.password,
        )
        return TokenResponse(access_token=res.access_token)
    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me", response_model=UserRead)
async def me(request: Request, user=Depends(get_current_user)) -> UserRead:
    return _to_user_read(user=user, request=request)


@router.post("/me/image", response_model=UserRead)
async def upload_profile_image(
    request: Request,
    image: UploadFile = File(...),
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> UserRead:
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and WEBP are supported")

    storage = StorageService(settings.shared_storage_path)
    image_path = await storage.save_profile_image(image)
    await UserRepository().update_image_path(session, user=user, image_path=image_path)
    await session.commit()
    await session.refresh(user)
    return _to_user_read(user=user, request=request)
