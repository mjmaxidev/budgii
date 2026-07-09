#!/usr/bin/env python3
"""Dispatch pending push notifications for every household.

Usage:
  cd budgii-api && python scripts/dispatch_push_notifications.py
  docker compose -f docker-compose.dev.yml run --rm --entrypoint python api scripts/dispatch_push_notifications.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import async_session_factory
from app.workers.push_notifications import dispatch_push_notifications_for_all_households


async def run() -> dict:
    async with async_session_factory() as session:
        try:
            summary = await dispatch_push_notifications_for_all_households(session)
            await session.commit()
            return summary.as_dict()
        except Exception:
            await session.rollback()
            raise


def main() -> None:
    summary = asyncio.run(run())
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
