#!/bin/sh
set -e

if [ "${BUDGII_RUN_MIGRATIONS:-true}" = "true" ]; then
  alembic upgrade head
fi

if [ "${BUDGII_DEV_SEED:-false}" = "true" ]; then
  python scripts/seed_dev_user.py
fi

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
