#!/usr/bin/env python3
"""Run a Budgii background job on a fixed interval."""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import signal
import sys
from collections.abc import Awaitable, Callable
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import async_session_factory
from app.services.background_jobs import record_background_job_run
from app.workers.push_notifications import dispatch_push_notifications_for_all_households
from app.workers.recurring import apply_due_recurring_for_all_households

logger = logging.getLogger("budgii.scheduler")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

SchedulerJob = Callable[[], Awaitable[dict[str, Any]]]


async def run_recurring_job() -> dict:
    async with async_session_factory() as session:
        try:
            summary = await apply_due_recurring_for_all_households(session, date.today())
            await session.commit()
            return summary.as_dict()
        except Exception:
            await session.rollback()
            raise


async def run_push_job() -> dict:
    async with async_session_factory() as session:
        try:
            summary = await dispatch_push_notifications_for_all_households(session)
            await session.commit()
            return summary.as_dict()
        except Exception:
            await session.rollback()
            raise


async def run_loop(job_name: str, job: SchedulerJob, interval_seconds: int, run_once: bool) -> None:
    stop_event = asyncio.Event()
    loop = asyncio.get_running_loop()
    for signame in ("SIGINT", "SIGTERM"):
        loop.add_signal_handler(getattr(signal, signame), stop_event.set)

    while not stop_event.is_set():
        started_at = datetime.now(timezone.utc)
        try:
            summary = await job()
            status = "failed" if summary_has_failures(summary) else "success"
            error = "One or more households failed during this run." if status == "failed" else None
            await record_scheduler_run(job_name, status, started_at, summary=summary, error=error)
            logger.info("%s job completed: %s", job_name, json.dumps(summary, sort_keys=True))
        except Exception as exc:
            await record_scheduler_run(job_name, "failed", started_at, error=str(exc))
            logger.exception("%s job failed", job_name)

        if run_once:
            return

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval_seconds)
        except TimeoutError:
            continue


def summary_has_failures(summary: dict[str, Any]) -> bool:
    failed_count = summary.get("failed_count")
    failed_households = summary.get("failed_household_ids")
    return (isinstance(failed_count, int) and failed_count > 0) or (
        isinstance(failed_households, list) and len(failed_households) > 0
    )


async def record_scheduler_run(
    job_name: str,
    status: str,
    started_at: datetime,
    *,
    summary: dict[str, Any] | None = None,
    error: str | None = None,
) -> None:
    async with async_session_factory() as session:
        try:
            await record_background_job_run(
                session,
                job_name=job_name,
                status=status,
                started_at=started_at,
                finished_at=datetime.now(timezone.utc),
                summary=summary,
                error=error,
            )
            await session.commit()
        except Exception:
            await session.rollback()
            logger.exception("Could not record %s scheduler status", job_name)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a Budgii background scheduler job")
    parser.add_argument("job", choices=["recurring", "push"], help="Job to run")
    parser.add_argument("--interval-seconds", type=int, default=3600, help="Seconds between runs")
    parser.add_argument("--once", action="store_true", help="Run one pass and exit")
    args = parser.parse_args()

    if args.interval_seconds < 60:
        raise SystemExit("--interval-seconds must be at least 60")

    jobs: dict[str, SchedulerJob] = {
        "recurring": run_recurring_job,
        "push": run_push_job,
    }
    asyncio.run(run_loop(args.job, jobs[args.job], args.interval_seconds, args.once))


if __name__ == "__main__":
    main()
