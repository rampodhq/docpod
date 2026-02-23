from __future__ import annotations

from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repo import UserRepository
from app.repositories.workspace_repo import WorkspaceRepository
from app.repositories.membership_repo import MembershipRepository
from app.core.security import hash_password, verify_password, create_access_token
from app.models.workspace import WorkspaceType
from app.models.membership import WorkspaceRole
from app.core.exceptions import AuthError


@dataclass(frozen=True)
class SignupResult:
    access_token: str


@dataclass(frozen=True)
class LoginResult:
    access_token: str


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        workspace_repo: WorkspaceRepository,
        membership_repo: MembershipRepository,
    ) -> None:
        self._users = user_repo
        self._workspaces = workspace_repo
        self._memberships = membership_repo

    async def signup(
        self,
        session: AsyncSession,
        *,
        name: str,
        email: str,
        password: str,
        account_type: str,
        organization_name: str | None,
        image_path: str | None = None,
    ) -> SignupResult:
        existing = await self._users.get_by_email(session, email)
        if existing:
            raise AuthError("Email already registered")

        normalized_account_type = "organization" if account_type == "organization" else "individual"
        user = await self._users.create(
            session,
            email=email,
            full_name=name,
            password_hash=hash_password(password),
            account_type=normalized_account_type,
            organization_name=organization_name if normalized_account_type == "organization" else None,
            image_path=image_path,
        )

        if normalized_account_type == "individual":
            ws_name = f"{email.split('@')[0]}'s Workspace"
            ws_type = WorkspaceType.PERSONAL
        else:
            if not organization_name:
                raise AuthError("organization_name is required for organization signup")
            ws_name = organization_name
            ws_type = WorkspaceType.ORG

        ws = await self._workspaces.create(session, name=ws_name, type_=ws_type, owner_user_id=user.id)

        await self._memberships.create(
            session,
            workspace_id=ws.id,
            user_id=user.id,
            role=WorkspaceRole.OWNER,
        )

        await session.commit()

        token = create_access_token(subject=str(user.id))
        return SignupResult(access_token=token)

    async def login(
        self,
        session: AsyncSession,
        *,
        email: str,
        password: str,
    ) -> LoginResult:
        user = await self._users.get_by_email(session, email)
        if not user or not verify_password(password, user.password_hash):
            raise AuthError("Invalid credentials")

        if not user.is_active:
            raise AuthError("User is inactive")

        token = create_access_token(subject=str(user.id))
        return LoginResult(access_token=token)
