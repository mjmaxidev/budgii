"""link expenses to normalized receipts

Revision ID: 004
Revises: 003
Create Date: 2026-07-07
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "expenses",
        sa.Column(
            "receipt_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("receipts.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_expenses_receipt_id", "expenses", ["receipt_id"])


def downgrade() -> None:
    op.drop_index("ix_expenses_receipt_id", table_name="expenses")
    op.drop_column("expenses", "receipt_id")
