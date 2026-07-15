#!/bin/sh
# Seed dev user inside the running Docker Compose api container.
set -e
cd "$(dirname "$0")/.."
docker compose -f ../docker-compose.yml exec api python scripts/seed_dev_user.py "$@"
