#!/bin/sh
# Seed a rich mock dataset inside the running Docker Compose api container.
set -e
cd "$(dirname "$0")/.."
docker compose -f ../docker-compose.dev.yml exec api python scripts/seed_mock_data.py "$@"
