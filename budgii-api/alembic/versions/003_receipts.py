"""add normalized receipts

Revision ID: 003
Revises: 002
Create Date: 2026-07-07
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "receipts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "upload_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("receipt_uploads.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("merchant", sa.String(length=160), nullable=False, server_default=""),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("total", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("ocr_text", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="uploaded"),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_receipts_household_date", "receipts", ["household_id", "date"])
    op.create_index("ix_receipts_household_updated_at", "receipts", ["household_id", "updated_at"])

    op.create_table(
        "receipt_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "receipt_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("receipts.id", ondelete="CASCADE"),
            nullable=False,
        ),
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
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("category_id", sa.String(length=80), nullable=False),
        sa.Column(
            "tag_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("ai_confidence", sa.Numeric(5, 4), nullable=False, server_default="0"),
        sa.Column("manually_edited", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_receipt_items_receipt_id", "receipt_items", ["receipt_id"])
    op.create_index("ix_receipt_items_household_id", "receipt_items", ["household_id"])


def downgrade() -> None:
    op.drop_index("ix_receipt_items_household_id", table_name="receipt_items")
    op.drop_index("ix_receipt_items_receipt_id", table_name="receipt_items")
    op.drop_table("receipt_items")
    op.drop_index("ix_receipts_household_updated_at", table_name="receipts")
    op.drop_index("ix_receipts_household_date", table_name="receipts")
    op.drop_table("receipts")
