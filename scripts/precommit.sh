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
  if printf "%s\n" "$STAGED_FILES" | grep -Eq '^(\.githooks/pre-commit|scripts/precommit\.sh)$'; then
    frontend_changed=1
    backend_changed=1
  fi

  if printf "%s\n" "$STAGED_FILES" | grep -Eq '^(src/|public/|index\.html|qa\.html|vite\.config\.ts|capacitor\.config\.ts|tailwind\.config\.(js|ts)|postcss\.config\.(js|cjs)|eslint\.config\.(js|mjs)|tsconfig[^/]*\.json|package\.json|package-lock\.json)$'; then
    frontend_changed=1
  fi

  if printf "%s\n" "$STAGED_FILES" | grep -Eq '^budgii-api/((app|tests|alembic|scripts)/.*\.py|scripts/lint\.sh|pyproject\.toml|requirements\.txt|Dockerfile|alembic\.ini)$'; then
    backend_changed=1
  fi
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
    api_container="$(docker compose -f docker-compose.dev.yml ps -q api 2>/dev/null || true)"
    if [ -n "$api_container" ]; then
      docker compose -f docker-compose.dev.yml exec -T api scripts/lint.sh
    elif docker image inspect budgii-api-api:latest >/dev/null 2>&1; then
      docker run --rm --entrypoint ruff -v "$PWD:/app" -w /app budgii-api-api check .
      docker run --rm --entrypoint ruff -v "$PWD:/app" -w /app budgii-api-api format --check .
    else
      echo "Ruff is not installed and the backend Docker image is missing."
      echo "Run: cd budgii-api && docker compose -f docker-compose.dev.yml build api"
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
