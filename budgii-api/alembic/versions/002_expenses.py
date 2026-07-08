"""add normalized expenses

Revision ID: 002
Revises: 001
Create Date: 2026-07-06
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "expenses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "persona_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("household_personas.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("category_id", sa.String(length=80), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("merchant", sa.String(length=160), nullable=False, server_default=""),
        sa.Column(
            "tag_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "receipt_upload_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("receipt_uploads.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("source", sa.String(length=32), nullable=False, server_default="manual"),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_expenses_household_date", "expenses", ["household_id", "date"])
    op.create_index("ix_expenses_household_updated_at", "expenses", ["household_id", "updated_at"])


def downgrade() -> None:
    op.drop_index("ix_expenses_household_updated_at", table_name="expenses")
    op.drop_index("ix_expenses_household_date", table_name="expenses")
    op.drop_table("expenses")
