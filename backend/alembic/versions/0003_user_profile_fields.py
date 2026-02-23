from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("full_name", sa.String(length=200), nullable=False, server_default=""))
    op.add_column(
        "users",
        sa.Column("account_type", sa.String(length=20), nullable=False, server_default="individual"),
    )
    op.add_column("users", sa.Column("organization_name", sa.String(length=200), nullable=True))
    op.add_column("users", sa.Column("image_path", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "image_path")
    op.drop_column("users", "organization_name")
    op.drop_column("users", "account_type")
    op.drop_column("users", "full_name")
