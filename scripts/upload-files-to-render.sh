#!/usr/bin/env bash
#
# Copy locally stored files to the Render disk.
#
#   ./scripts/upload-files-to-render.sh <service-id>
#
# The database dump carries only the PATHS of uploaded files, not the
# files themselves, so without this step every attachment row points at
# something that is not there.
#
# Needs the Render CLI, authenticated:
#   brew install render
#   render login
#
# Find the service id in the dashboard URL for mikan-api (srv-...).

set -o errexit

SERVICE="${1:-}"
LOCAL_DIR="${LOCAL_DIR:-api/storage}"
REMOTE_DIR="/var/data/uploads"

if [[ -z "$SERVICE" ]]; then
  echo "usage: $0 <service-id>   # e.g. srv-abc123" >&2
  exit 1
fi

if [[ ! -d "$LOCAL_DIR" ]]; then
  echo "error: $LOCAL_DIR does not exist — nothing to copy." >&2
  exit 1
fi

COUNT="$(find "$LOCAL_DIR" -type f | wc -l | tr -d ' ')"
if [[ "$COUNT" == "0" ]]; then
  echo "No stored files. Nothing to do."
  exit 0
fi

echo "==> $COUNT file(s) to copy to ${SERVICE}:${REMOTE_DIR}"

# A tarball keeps the organisation/task directory structure, which the
# stored_path column depends on. Sending files one by one would lose it.
TAR="/tmp/mikan-uploads-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$TAR" -C "$LOCAL_DIR" .
echo "    packed $(du -h "$TAR" | cut -f1)"

echo "==> Opening a shell on the service"
echo "    Run these there, then exit:"
echo
echo "      cd ${REMOTE_DIR} && tar -xzf - "
echo
echo "    Piping the archive in now."

# render ssh streams stdin, so the tarball unpacks straight onto the disk.
render ssh "$SERVICE" --  "mkdir -p ${REMOTE_DIR} && cd ${REMOTE_DIR} && tar -xzf -" < "$TAR"

echo "==> Verifying"
render ssh "$SERVICE" -- "find ${REMOTE_DIR} -type f | wc -l" | sed 's/^/    remote file count: /'

echo
echo "Done. Archive kept at $TAR — delete it once you are satisfied."
