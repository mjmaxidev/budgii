"""add auth action tokens

Revision ID: 010
Revises: 009
Create Date: 2026-07-10
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.create_table(
        "auth_action_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("purpose", sa.String(length=32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("token_hash", name="uq_auth_action_token_hash"),
    )
    op.create_index("ix_auth_action_tokens_token_hash", "auth_action_tokens", ["token_hash"])
    op.create_index("ix_auth_action_tokens_purpose", "auth_action_tokens", ["purpose"])
    op.create_index("ix_auth_action_tokens_expires_at", "auth_action_tokens", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_auth_action_tokens_expires_at", table_name="auth_action_tokens")
    op.drop_index("ix_auth_action_tokens_purpose", table_name="auth_action_tokens")
    op.drop_index("ix_auth_action_tokens_token_hash", table_name="auth_action_tokens")
    op.drop_table("auth_action_tokens")
    op.drop_column("users", "email_verified_at")
