from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    async def get_by_email(self, session: AsyncSession, email: str) -> User | None:
        res = await session.execute(select(User).where(User.email == email))
        return res.scalar_one_or_none()

    async def get_by_id(self, session: AsyncSession, user_id) -> User | None:
        res = await session.execute(select(User).where(User.id == user_id))
        return res.scalar_one_or_none()

    async def create(
        self,
        session: AsyncSession,
        *,
        email: str,
        full_name: str,
        password_hash: str,
        account_type: str,
        organization_name: str | None = None,
        image_path: str | None = None,
    ) -> User:
        user = User(
            email=email,
            full_name=full_name,
            password_hash=password_hash,
            account_type=account_type,
            organization_name=organization_name,
            image_path=image_path,
        )
        session.add(user)
        await session.flush()
        return user

    async def update_image_path(self, session: AsyncSession, *, user: User, image_path: str) -> User:
        user.image_path = image_path
        await session.flush()
        return user
