#!/usr/bin/env python3
"""Apply due recurring transactions for every household.

Usage:
  cd budgii-api && python scripts/apply_recurring.py
  cd budgii-api && python scripts/apply_recurring.py --date 2026-07-09
  docker compose -f docker-compose.dev.yml run --rm --entrypoint python api scripts/apply_recurring.py
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import async_session_factory
from app.workers.recurring import apply_due_recurring_for_all_households


def parse_date(value: str | None) -> date:
    if not value:
        return date.today()
    return date.fromisoformat(value)


async def run(due_date: date) -> dict:
    async with async_session_factory() as session:
        try:
            summary = await apply_due_recurring_for_all_households(session, due_date)
            await session.commit()
            return summary.as_dict()
        except Exception:
            await session.rollback()
            raise


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply due recurring transactions for every household")
    parser.add_argument("--date", help="Due date to apply in YYYY-MM-DD format. Defaults to today.")
    args = parser.parse_args()

    summary = asyncio.run(run(parse_date(args.date)))
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
