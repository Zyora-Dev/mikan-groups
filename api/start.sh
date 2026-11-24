#!/usr/bin/env bash
# Start step. Migrations run here rather than in the build, so they
# execute against the live database and a failure stops the release
# instead of serving an app against a stale schema.
set -o errexit

alembic upgrade head

# --proxy-headers so the app sees the scheme and client IP the proxy
# reports rather than the plain HTTP hop from it. Without this, rate
# limiting would count every request against the proxy's address.
exec uvicorn app.main:app \
  --host 127.0.0.1 \
  --port "${PORT:-8000}" \
  --proxy-headers \
  --forwarded-allow-ips '*'
