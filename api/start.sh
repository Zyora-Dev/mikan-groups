#!/usr/bin/env bash
# Render start step. Migrations run here rather than in the build, so
# they execute against the live database with its env vars present, and
# a failed migration stops the release instead of serving a broken app.
set -o errexit

alembic upgrade head

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
