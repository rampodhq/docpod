from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_templates_workspace_deleted", "templates", ["workspace_id", "is_deleted"], unique=False)
    op.create_index("ix_templates_workspace_created", "templates", ["workspace_id", "created_at"], unique=False)

    op.create_table(
        "template_sections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("templates.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("content_instructions", sa.Text(), nullable=True),
        sa.Column("allowed_styles", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("allow_additional_context", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("template_id", "order_index", name="uq_template_section_order"),
    )
    op.create_index("ix_template_sections_template_deleted", "template_sections", ["template_id", "is_deleted"], unique=False)

    op.create_table(
        "template_context_inputs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("section_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("template_sections.id"), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("input_type", sa.Enum("FILE", "TEXT", "WEBSITE", name="context_input_type"), nullable=False),
        sa.Column("required", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("allowed_file_types", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("section_id", "order_index", name="uq_section_input_order"),
    )
    op.create_index("ix_template_context_inputs_section_deleted", "template_context_inputs", ["section_id", "is_deleted"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_template_context_inputs_section_deleted", table_name="template_context_inputs")
    op.drop_table("template_context_inputs")

    op.drop_index("ix_template_sections_template_deleted", table_name="template_sections")
    op.drop_table("template_sections")

    op.drop_index("ix_templates_workspace_created", table_name="templates")
    op.drop_index("ix_templates_workspace_deleted", table_name="templates")
    op.drop_table("templates")

    op.execute("DROP TYPE IF EXISTS context_input_type")