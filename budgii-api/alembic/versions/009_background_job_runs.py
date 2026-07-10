"""add background job runs

Revision ID: 009
Revises: 008
Create Date: 2026-07-10
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "background_job_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("job_name", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
    )
    op.create_index("ix_background_job_runs_job_name", "background_job_runs", ["job_name"])
    op.create_index("ix_background_job_runs_status", "background_job_runs", ["status"])
    op.create_index("ix_background_job_runs_started_at", "background_job_runs", ["started_at"])
    op.create_index("ix_background_job_runs_finished_at", "background_job_runs", ["finished_at"])


def downgrade() -> None:
    op.drop_index("ix_background_job_runs_finished_at", table_name="background_job_runs")
    op.drop_index("ix_background_job_runs_started_at", table_name="background_job_runs")
    op.drop_index("ix_background_job_runs_status", table_name="background_job_runs")
    op.drop_index("ix_background_job_runs_job_name", table_name="background_job_runs")
    op.drop_table("background_job_runs")
