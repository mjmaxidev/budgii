"""add notification device tokens

Revision ID: 007
Revises: 006
Create Date: 2026-07-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_device_tokens",
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
        sa.Column("token", sa.String(length=512), nullable=False),
        sa.Column("platform", sa.String(length=32), nullable=False),
        sa.Column("device_id", sa.String(length=120), nullable=True),
        sa.Column("app_version", sa.String(length=64), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("household_id", "user_id", "token", name="uq_notification_device_token"),
    )
    op.create_index(
        "ix_notification_device_tokens_household_id",
        "notification_device_tokens",
        ["household_id"],
    )
    op.create_index("ix_notification_device_tokens_user_id", "notification_device_tokens", ["user_id"])
    op.create_index("ix_notification_device_tokens_token", "notification_device_tokens", ["token"])


def downgrade() -> None:
    op.drop_index("ix_notification_device_tokens_token", table_name="notification_device_tokens")
    op.drop_index("ix_notification_device_tokens_user_id", table_name="notification_device_tokens")
    op.drop_index("ix_notification_device_tokens_household_id", table_name="notification_device_tokens")
    op.drop_table("notification_device_tokens")
