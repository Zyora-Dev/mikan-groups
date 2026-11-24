"""A small fixed-window rate limiter, held in process memory.

The per-account lockout in the auth router stops someone guessing one
password repeatedly. This stops the other shape of the attack: one
attacker trying a single common password against thousands of accounts,
which never trips a per-account counter.

State lives in this process, so with several workers the effective limit
is the configured number multiplied by the worker count. That is fine
for the volumes here, and the lockout remains the real protection. Swap
`_HITS` for Redis when the deployment grows past one box.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

# key -> (window start, count within that window)
_HITS: dict[str, tuple[float, int]] = defaultdict(lambda: (0.0, 0))
_LOCK = threading.Lock()

# Stop the dict growing without bound on a long-lived process.
_SWEEP_EVERY = 2000
_since_sweep = 0


def client_ip(request: Request) -> str:
    """The caller's address, trusting the proxy header only for its last hop.

    Vercel and most proxies append the real client to X-Forwarded-For, so
    the first entry is the one the edge saw. It is still client-supplied
    and must never be used for anything but coarse rate limiting.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    return request.client.host if request.client else "unknown"


def _sweep(now: float, window: int) -> None:
    for key, (started, _) in list(_HITS.items()):
        if now - started > window:
            _HITS.pop(key, None)


def hit(key: str, *, limit: int, window: int) -> bool:
    """Record one attempt. Returns False once the limit is exceeded."""
    global _since_sweep
    now = time.monotonic()

    with _LOCK:
        _since_sweep += 1
        if _since_sweep >= _SWEEP_EVERY:
            _since_sweep = 0
            _sweep(now, window)

        started, count = _HITS[key]
        if now - started > window:
            _HITS[key] = (now, 1)
            return True

        if count >= limit:
            return False

        _HITS[key] = (started, count + 1)
        return True


def enforce(request: Request, *, bucket: str, limit: int, window: int) -> None:
    """Raise 429 when the caller has spent their allowance."""
    if not hit(f"{bucket}:{client_ip(request)}", limit=limit, window=window):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many attempts. Please wait a few minutes and try again.",
            headers={"Retry-After": str(window)},
        )


def reset(bucket: str, request: Request) -> None:
    """Clear the counter — called after a success, so one good sign-in
    does not leave a shared office address near its limit."""
    with _LOCK:
        _HITS.pop(f"{bucket}:{client_ip(request)}", None)
