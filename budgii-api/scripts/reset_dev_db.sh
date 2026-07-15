#!/bin/sh
# Reset the local Docker Postgres schema, run migrations, and load rich mock data.
set -e

if [ "$1" != "--yes" ]; then
  echo "This deletes all local Budgii database rows in the Docker dev database."
  echo "Receipt files in the Docker upload volume are left untouched."
  echo ""
  echo "Usage: scripts/reset_dev_db.sh --yes"
  exit 1
fi

cd "$(dirname "$0")/.."

COMPOSE_FILE="${COMPOSE_FILE:-../docker-compose.yml}"

docker compose -f "$COMPOSE_FILE" up -d db api
docker compose -f "$COMPOSE_FILE" exec -T db psql -U budgii -d budgii -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
docker compose -f "$COMPOSE_FILE" exec -T api alembic upgrade head
docker compose -f "$COMPOSE_FILE" exec -T api python scripts/seed_mock_data.py --force

echo ""
echo "Budgii dev database reset complete."
echo "Login: dev@mjproductions.app / password"
