#!/bin/sh
set -eu

target="${1:-.env.server}"

if [ -f "$target" ] && [ "${2:-}" != "--force" ]; then
  echo "$target already exists. Pass --force as the second argument to replace it."
  exit 1
fi

postgres_password="$(openssl rand -hex 24)"
jwt_secret="$(openssl rand -hex 32)"

cat >"$target" <<EOF
APP_ENV=production
APP_DEBUG=false
API_PREFIX=/v1

CORS_ORIGINS=http://localhost:18088,http://127.0.0.1:18088,https://budgii.com.au,capacitor://localhost
VITE_SHOW_DEMO_TOOLS=false

POSTGRES_USER=budgii
POSTGRES_PASSWORD=$postgres_password
POSTGRES_DB=budgii

JWT_SECRET=$jwt_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30
AUTH_RATE_LIMIT_ENABLED=true
AUTH_RATE_LIMIT_REQUESTS=10
AUTH_RATE_LIMIT_WINDOW_SECONDS=60

APPLE_CLIENT_ID=
GOOGLE_CLIENT_ID=

OPENAI_API_KEY=

INVITE_LINK_BASE=https://budgii.com.au/join
AUTH_LINK_BASE=http://localhost:18088
INVITE_EMAIL_PROVIDER=log
INVITE_EMAIL_FROM=
INVITE_EMAIL_API_KEY=

RECEIPT_STORAGE_PATH=/app/uploads
RECEIPT_OCR_PROVIDER=openai
RECEIPT_OPENAI_MODEL=gpt-5.5

PUSH_PROVIDER=log

EOF

chmod 600 "$target"
echo "Created $target with generated POSTGRES_PASSWORD and JWT_SECRET."
