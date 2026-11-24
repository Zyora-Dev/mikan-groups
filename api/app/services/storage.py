"""File storage.

Files live on local disk under STORAGE_ROOT, partitioned by organisation so
one tenant's directory never contains another's. Swapping this for S3 or
Mikan Cloud means replacing `save` and `resolve` — the API shape stays.
"""

from __future__ import annotations

import re
import secrets
from pathlib import Path
from uuid import UUID

STORAGE_ROOT = Path(__file__).resolve().parents[2] / "storage"

MAX_BYTES = 50 * 1024 * 1024  # 50 MB

ALLOWED_SUFFIXES = {
    ".pdf", ".dwg", ".dxf", ".doc", ".docx", ".xls", ".xlsx",
    ".png", ".jpg", ".jpeg", ".zip", ".rvt", ".ifc", ".nwd", ".nwc",
}

_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def safe_name(name: str) -> str:
    """Strip anything that could escape the storage directory."""
    cleaned = _SAFE.sub("_", Path(name).name).strip("._") or "file"
    return cleaned[:120]


def save(org_id: UUID, task_id: UUID, filename: str, data: bytes) -> str:
    """Write the file and return a path relative to STORAGE_ROOT."""
    name = safe_name(filename)
    folder = STORAGE_ROOT / str(org_id) / str(task_id)
    folder.mkdir(parents=True, exist_ok=True)

    # Prefix keeps two uploads of the same name from colliding.
    target = folder / f"{secrets.token_hex(6)}_{name}"
    target.write_bytes(data)
    return str(target.relative_to(STORAGE_ROOT))


def resolve(stored_path: str) -> Path | None:
    """Absolute path for a stored file, or None if it escapes the root."""
    candidate = (STORAGE_ROOT / stored_path).resolve()
    try:
        candidate.relative_to(STORAGE_ROOT.resolve())
    except ValueError:
        return None  # traversal attempt
    return candidate if candidate.is_file() else None


def remove(stored_path: str) -> None:
    target = resolve(stored_path)
    if target:
        target.unlink(missing_ok=True)
