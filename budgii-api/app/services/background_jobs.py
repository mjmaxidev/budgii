from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BackgroundJobRun


async def record_background_job_run(
    session: AsyncSession,
    *,
    job_name: str,
    status: str,
    started_at: datetime,
    finished_at: datetime,
    summary: dict[str, Any] | None = None,
    error: str | None = None,
) -> BackgroundJobRun:
    run = BackgroundJobRun(
        job_name=job_name,
        status=status,
        started_at=started_at,
        finished_at=finished_at,
        summary=summary,
        error=error,
    )
    session.add(run)
    await session.flush()
    return run


async def latest_background_job_runs(
    session: AsyncSession,
    job_names: list[str],
) -> list[BackgroundJobRun]:
    result = await session.scalars(
        select(BackgroundJobRun)
        .where(BackgroundJobRun.job_name.in_(job_names))
        .order_by(BackgroundJobRun.started_at.desc())
        .limit(max(len(job_names) * 5, 10))
    )
    latest_by_name: dict[str, BackgroundJobRun] = {}
    for run in result.all():
        if run.job_name not in latest_by_name:
            latest_by_name[run.job_name] = run
    return [latest_by_name[name] for name in job_names if name in latest_by_name]
