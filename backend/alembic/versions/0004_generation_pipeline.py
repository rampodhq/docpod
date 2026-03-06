from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("templates.id"), nullable=False),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column(
            "status",
            sa.Enum("QUEUED", "GENERATING", "COMPLETED", "FAILED", "CANCELLED", name="document_status"),
            nullable=False,
            server_default="QUEUED",
        ),
        sa.Column("latest_generation_job_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_documents_workspace_deleted_created",
        "documents",
        ["workspace_id", "is_deleted", "created_at"],
        unique=False,
    )
    op.create_index("ix_documents_workspace_status", "documents", ["workspace_id", "status"], unique=False)

    op.create_table(
        "generation_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("documents.id"), nullable=False),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("templates.id"), nullable=False),
        sa.Column("requested_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "status",
            sa.Enum("QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED", name="generation_job_status"),
            nullable=False,
            server_default="QUEUED",
        ),
        sa.Column("pipeline_version", sa.String(length=50), nullable=False, server_default="v1"),
        sa.Column("model_profile", sa.String(length=50), nullable=False, server_default="balanced_v1"),
        sa.Column("input_snapshot", postgresql.JSONB(), nullable=False),
        sa.Column("retrieval_snapshot", postgresql.JSONB(), nullable=True),
        sa.Column("plan_json", postgresql.JSONB(), nullable=True),
        sa.Column("section_outputs", postgresql.JSONB(), nullable=True),
        sa.Column("final_markdown", sa.Text(), nullable=True),
        sa.Column("final_html", sa.Text(), nullable=True),
        sa.Column("token_usage_json", postgresql.JSONB(), nullable=True),
        sa.Column("cost_usd", sa.Numeric(10, 4), nullable=False, server_default="0"),
        sa.Column("error_code", sa.String(length=100), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_generation_jobs_workspace_document_created",
        "generation_jobs",
        ["workspace_id", "document_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_generation_jobs_workspace_status_created",
        "generation_jobs",
        ["workspace_id", "status", "created_at"],
        unique=False,
    )

    op.create_table(
        "generation_events",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("generation_jobs.id"), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_generation_events_job_id", "generation_events", ["job_id", "id"], unique=False)

    op.create_table(
        "document_artifacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("documents.id"), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("generation_jobs.id"), nullable=False),
        sa.Column(
            "artifact_type",
            sa.Enum("MARKDOWN", "HTML", "TXT", "PDF", name="document_artifact_type"),
            nullable=False,
        ),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_document_artifacts_workspace_document_type_created",
        "document_artifacts",
        ["workspace_id", "document_id", "artifact_type", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_document_artifacts_workspace_document_type_created", table_name="document_artifacts")
    op.drop_table("document_artifacts")

    op.drop_index("ix_generation_events_job_id", table_name="generation_events")
    op.drop_table("generation_events")

    op.drop_index("ix_generation_jobs_workspace_status_created", table_name="generation_jobs")
    op.drop_index("ix_generation_jobs_workspace_document_created", table_name="generation_jobs")
    op.drop_table("generation_jobs")

    op.drop_index("ix_documents_workspace_status", table_name="documents")
    op.drop_index("ix_documents_workspace_deleted_created", table_name="documents")
    op.drop_table("documents")

    op.execute("DROP TYPE IF EXISTS document_artifact_type")
    op.execute("DROP TYPE IF EXISTS generation_job_status")
    op.execute("DROP TYPE IF EXISTS document_status")
