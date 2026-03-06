from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "template_context_inputs",
        sa.Column("template_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    op.execute(
        """
        UPDATE template_context_inputs tci
        SET template_id = ts.template_id
        FROM template_sections ts
        WHERE tci.section_id = ts.id
        """
    )

    op.alter_column("template_context_inputs", "template_id", nullable=False)
    op.create_foreign_key(
        "fk_template_context_inputs_template_id_templates",
        "template_context_inputs",
        "templates",
        ["template_id"],
        ["id"],
    )

    op.alter_column("template_context_inputs", "section_id", nullable=True)

    op.drop_index("ix_template_context_inputs_section_deleted", table_name="template_context_inputs")
    op.create_index(
        "ix_template_context_inputs_template_deleted",
        "template_context_inputs",
        ["template_id", "is_deleted"],
        unique=False,
    )

    op.create_index(
        "uq_template_doc_input_order",
        "template_context_inputs",
        ["template_id", "order_index"],
        unique=True,
        postgresql_where=sa.text("section_id IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_template_doc_input_order", table_name="template_context_inputs")

    op.drop_index("ix_template_context_inputs_template_deleted", table_name="template_context_inputs")
    op.create_index(
        "ix_template_context_inputs_section_deleted",
        "template_context_inputs",
        ["section_id", "is_deleted"],
        unique=False,
    )

    op.alter_column("template_context_inputs", "section_id", nullable=False)

    op.drop_constraint(
        "fk_template_context_inputs_template_id_templates",
        "template_context_inputs",
        type_="foreignkey",
    )
    op.drop_column("template_context_inputs", "template_id")
