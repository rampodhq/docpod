from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import bearer_scheme, decode_access_token
from app.db.session import get_db_session
from app.repositories.membership_repo import MembershipRepository
from app.repositories.user_repo import UserRepository
from app.repositories.workspace_repo import WorkspaceRepository


async def get_current_user(
    credentials=Depends(bearer_scheme),
    session: AsyncSession = Depends(get_db_session),
):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_uuid = uuid.UUID(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await UserRepository().get_by_id(session, user_uuid)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


async def get_current_workspace(
    x_workspace_id: Annotated[str, Header(alias="X-Workspace-Id")],
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    try:
        workspace_id = uuid.UUID(x_workspace_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-Workspace-Id")

    ws_repo = WorkspaceRepository()
    workspace = await ws_repo.get_by_id(session, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    membership = await MembershipRepository().get_membership(
        session,
        workspace_id=workspace_id,
        user_id=user.id,
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized for workspace")

    return workspace


async def get_session(session: AsyncSession = Depends(get_db_session)) -> AsyncSession:
    return session
