"""add notification push deliveries

Revision ID: 008
Revises: 007
Create Date: 2026-07-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_push_deliveries",
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
        sa.Column(
            "device_token_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("notification_device_tokens.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("notification_id", sa.String(length=160), nullable=False),
        sa.Column("notification_type", sa.String(length=64), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False, server_default="log"),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint(
            "device_token_id",
            "notification_id",
            name="uq_notification_push_delivery_token_notification",
        ),
    )
    op.create_index(
        "ix_notification_push_deliveries_household_id",
        "notification_push_deliveries",
        ["household_id"],
    )
    op.create_index("ix_notification_push_deliveries_user_id", "notification_push_deliveries", ["user_id"])
    op.create_index(
        "ix_notification_push_deliveries_device_token_id",
        "notification_push_deliveries",
        ["device_token_id"],
    )
    op.create_index(
        "ix_notification_push_deliveries_notification_id",
        "notification_push_deliveries",
        ["notification_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_notification_push_deliveries_notification_id", table_name="notification_push_deliveries"
    )
    op.drop_index(
        "ix_notification_push_deliveries_device_token_id", table_name="notification_push_deliveries"
    )
    op.drop_index("ix_notification_push_deliveries_user_id", table_name="notification_push_deliveries")
    op.drop_index("ix_notification_push_deliveries_household_id", table_name="notification_push_deliveries")
    op.drop_table("notification_push_deliveries")
