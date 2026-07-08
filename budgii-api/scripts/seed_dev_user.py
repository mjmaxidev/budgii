#!/usr/bin/env python3
"""Seed a dev user + household with default Budgii sync data.

Usage (host, postgres on localhost:5432):
  cd budgii-api && python scripts/seed_dev_user.py

Usage (Docker Compose api container):
  docker compose exec api python scripts/seed_dev_user.py

Defaults match the frontend login form (dev@mjproductions.app / password).
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import date
from pathlib import Path

# Allow `python scripts/seed_dev_user.py` from budgii-api/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import async_session_factory
from app.models import HouseholdSyncChunk, User
from app.services.household import create_household
from app.services.security import hash_password
from sqlalchemy import select

DEFAULT_EMAIL = "dev@mjproductions.app"
DEFAULT_PASSWORD = "password"
DEFAULT_NAME = "Alex"
DEFAULT_HOUSEHOLD = "Lee Household"


def demo_expenses() -> list[dict]:
    today = date.today()
    month_start = today.replace(day=1).isoformat()
    mid_month = today.replace(day=min(15, today.day)).isoformat()
    return [
        {
            "id": "exp-seed-groceries",
            "amount": 84.5,
            "date": month_start,
            "categoryId": "cat-groceries",
            "merchant": "Coles",
            "note": "Weekly shop",
            "memberIds": [],
            "tagIds": [],
        },
        {
            "id": "exp-seed-dining",
            "amount": 42.0,
            "date": mid_month,
            "categoryId": "cat-dining",
            "merchant": "Local Cafe",
            "note": "",
            "memberIds": [],
            "tagIds": [],
        },
        {
            "id": "exp-seed-transport",
            "amount": 28.9,
            "date": today.isoformat(),
            "categoryId": "cat-transport",
            "merchant": "Uber",
            "note": "",
            "memberIds": [],
            "tagIds": [],
        },
    ]


async def seed_demo_expenses(session, household_id) -> int:
    chunk = await session.scalar(
        select(HouseholdSyncChunk).where(
            HouseholdSyncChunk.household_id == household_id,
            HouseholdSyncChunk.chunk_key == "expenses",
        )
    )
    if not chunk:
        return 0

    expenses = list(chunk.data or [])
    existing_ids = {e.get("id") for e in expenses if isinstance(e, dict)}
    added = 0
    for expense in demo_expenses():
        if expense["id"] not in existing_ids:
            expenses.append(expense)
            added += 1

    if added:
        chunk.data = expenses
        await session.flush()
    return added


async def run(
    email: str,
    password: str,
    name: str,
    household_name: str,
    *,
    force: bool,
) -> None:
    normalized = email.strip().lower()

    async with async_session_factory() as session:
        existing = await session.scalar(select(User).where(User.email == normalized))

        if existing and not force:
            from app.models import HouseholdMembership

            membership = await session.scalar(
                select(HouseholdMembership).where(HouseholdMembership.user_id == existing.id)
            )
            if membership:
                added = await seed_demo_expenses(session, membership.household_id)
                await session.commit()
                print(f"User already exists: {normalized} (id={existing.id})")
                if added:
                    print(f"Added {added} demo expense(s) to household {membership.household_id}")
                else:
                    print(f"Household {membership.household_id} unchanged")
                return
            print(f"User exists without household: {normalized} (id={existing.id})")
            return

        if existing and force:
            await session.delete(existing)
            await session.flush()

        user = User(
            email=normalized,
            password_hash=hash_password(password),
            name=name.strip(),
            auth_provider="email",
        )
        session.add(user)
        await session.flush()

        household, membership = await create_household(session, user, household_name)
        added = await seed_demo_expenses(session, household.id)
        await session.commit()

        print("Seeded dev user:")
        print(f"  email:      {normalized}")
        print(f"  password:   {password}")
        print(f"  user_id:    {user.id}")
        print(f"  household:  {household.name} ({household.id})")
        print(f"  role:       {membership.access_role}")
        if added:
            print(f"  expenses:   +{added} demo row(s)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed a Budgii dev user and household")
    parser.add_argument("--email", default=DEFAULT_EMAIL)
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    parser.add_argument("--name", default=DEFAULT_NAME)
    parser.add_argument("--household", default=DEFAULT_HOUSEHOLD)
    parser.add_argument(
        "--force",
        action="store_true",
        help="Delete existing user with this email and recreate",
    )
    args = parser.parse_args()

    if len(args.password) < 8:
        parser.error("password must be at least 8 characters")

    asyncio.run(
        run(
            args.email,
            args.password,
            args.name,
            args.household,
            force=args.force,
        )
    )


if __name__ == "__main__":
    main()
