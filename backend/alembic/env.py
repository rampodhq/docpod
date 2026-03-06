from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.core.config import settings
from app.db.base import Base

# Ensure models are imported so Base.metadata is populated
from app.models.user import User  # noqa: F401
from app.models.workspace import Workspace  # noqa: F401
from app.models.membership import WorkspaceMembership  # noqa: F401
from app.models.template import Template  # noqa: F401
from app.models.template_section import TemplateSection  # noqa: F401
from app.models.template_context_input import TemplateContextInput  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.generation_job import GenerationJob  # noqa: F401
from app.models.generation_event import GenerationEvent  # noqa: F401
from app.models.document_artifact import DocumentArtifact  # noqa: F401
from app.models.contact_submission import ContactSubmission  # noqa: F401

config = context.config
fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.database_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable: AsyncEngine = create_async_engine(
        settings.database_url,
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online_sync() -> None:
    asyncio.run(run_migrations_online())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online_sync()
