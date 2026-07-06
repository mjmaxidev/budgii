#!/bin/sh
set -e
alembic upgrade head

if [ "${BUDGII_DEV_SEED:-false}" = "true" ]; then
  python scripts/seed_dev_user.py
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
