"""add notification read states

Revision ID: 006
Revises: 005
Create Date: 2026-07-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_read_states",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "household_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("households.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("notification_id", sa.String(length=160), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("household_id", "user_id", "notification_id", name="uq_notification_read_state"),
    )
    op.create_index("ix_notification_read_states_household_id", "notification_read_states", ["household_id"])
    op.create_index("ix_notification_read_states_user_id", "notification_read_states", ["user_id"])
    op.create_index(
        "ix_notification_read_states_notification_id", "notification_read_states", ["notification_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_notification_read_states_notification_id", table_name="notification_read_states")
    op.drop_index("ix_notification_read_states_user_id", table_name="notification_read_states")
    op.drop_index("ix_notification_read_states_household_id", table_name="notification_read_states")
    op.drop_table("notification_read_states")
