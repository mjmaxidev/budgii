#!/bin/sh
set -eu

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

STAGED_FILES="$(git diff --cached --name-only --diff-filter=ACMR || true)"
RUN_ALL="${RUN_ALL:-0}"

frontend_changed=0
backend_changed=0

if [ "$RUN_ALL" = "1" ]; then
  frontend_changed=1
  backend_changed=1
else
  for file in $STAGED_FILES; do
    case "$file" in
      .githooks/pre-commit | scripts/precommit.sh)
        frontend_changed=1
        backend_changed=1
        ;;
      src/* | public/* | index.html | qa.html | vite.config.ts | capacitor.config.ts | \
        tailwind.config.js | tailwind.config.ts | postcss.config.js | postcss.config.cjs | \
        eslint.config.js | eslint.config.mjs | tsconfig*.json | package.json | package-lock.json | \
        yarn.lock)
        frontend_changed=1
        ;;
      budgii-api/app/*.py | budgii-api/tests/*.py | budgii-api/alembic/*.py | \
        budgii-api/alembic/versions/*.py | budgii-api/scripts/*.py | budgii-api/scripts/lint.sh | \
        budgii-api/pyproject.toml | budgii-api/requirements.txt | budgii-api/Dockerfile | \
        budgii-api/alembic.ini)
        backend_changed=1
        ;;
    esac
  done
fi

if [ -z "$STAGED_FILES" ] && [ "$RUN_ALL" != "1" ]; then
  echo "No staged files to check."
  exit 0
fi

if [ "$RUN_ALL" = "1" ]; then
  echo "Checking whitespace..."
  git diff --check
else
  echo "Checking staged whitespace..."
  git diff --cached --check
fi

if [ "$frontend_changed" = "1" ]; then
  echo "Running frontend lint..."
  npm run lint

  echo "Running frontend format check..."
  npm run format:check
else
  echo "Skipping frontend checks; no staged frontend files."
fi

if [ "$backend_changed" = "1" ]; then
  echo "Running backend Ruff checks..."
  cd "$ROOT/budgii-api"

  if command -v ruff >/dev/null 2>&1; then
    scripts/lint.sh
  elif command -v docker >/dev/null 2>&1; then
    api_container="$(docker compose -f "$ROOT/docker-compose.dev.yml" ps -q api 2>/dev/null || true)"
    if [ -n "$api_container" ]; then
      docker compose -f "$ROOT/docker-compose.dev.yml" exec -T api scripts/lint.sh
    elif docker image inspect budgii-api-api:latest >/dev/null 2>&1; then
      docker run --rm --entrypoint ruff -v "$PWD:/app" -w /app budgii-api-api check .
      docker run --rm --entrypoint ruff -v "$PWD:/app" -w /app budgii-api-api format --check .
    else
      echo "Ruff is not installed and the backend Docker image is missing."
      echo "Run: docker compose -f docker-compose.dev.yml build api"
      exit 1
    fi
  else
    echo "Ruff is not installed and Docker is unavailable."
    echo "Install Ruff locally or start/build the backend Docker service."
    exit 1
  fi
else
  echo "Skipping backend checks; no staged backend files."
fi

echo "Pre-commit checks passed."
