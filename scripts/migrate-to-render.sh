#!/usr/bin/env bash
#
# Copy the local database to Render.
#
#   ./scripts/migrate-to-render.sh '<render external connection string>'
#
# Take the External Database URL from the Render dashboard (mikan-db ->
# Connect -> External). Quote it: it contains characters the shell eats.
#
# Safe to re-run. The restore drops and recreates each table, so a
# second run replaces the data rather than duplicating it.

set -o errexit
set -o pipefail

LOCAL_DB="${LOCAL_DB:-mikan-groups-db}"
TARGET="${1:-}"

if [[ -z "$TARGET" ]]; then
  echo "usage: $0 '<render external connection string>'" >&2
  exit 1
fi

if [[ "$TARGET" != postgres* ]]; then
  echo "error: that does not look like a connection string." >&2
  echo "       expected postgresql://... from Render -> mikan-db -> Connect" >&2
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="/tmp/mikan-${STAMP}.dump"

echo "==> Dumping ${LOCAL_DB}"
# Custom format so pg_restore can drop objects cleanly on a re-run.
# --no-owner / --no-acl because the Render role differs from the local one.
pg_dump --format=custom --no-owner --no-acl \
        --file="$DUMP" "$LOCAL_DB"

SIZE="$(du -h "$DUMP" | cut -f1)"
echo "    wrote $DUMP ($SIZE)"

echo "==> Row counts in the dump"
pg_restore --list "$DUMP" | grep -c "TABLE DATA" | xargs echo "    tables with data:"

echo "==> Restoring into Render"
# --clean --if-exists so re-running replaces rather than conflicts.
# alembic_version comes across too, so the API will not re-run migrations
# it has already applied.
pg_restore --no-owner --no-acl --clean --if-exists \
           --dbname="$TARGET" "$DUMP"

echo "==> Verifying"
psql "$TARGET" -At -c "
  select table_name || ' ' || (
    xpath('/row/c/text()',
          query_to_xml(format('select count(*) as c from %I.%I',
                              table_schema, table_name),
                       false, true, ''))
  )[1]::text
  from information_schema.tables
  where table_schema = 'public'
  order by table_name;
" | sed 's/^/    /'

echo
echo "Done. Dump kept at $DUMP — delete it once you are satisfied."
