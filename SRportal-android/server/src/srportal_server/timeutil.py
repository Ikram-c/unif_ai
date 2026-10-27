"""ISO-8601 helpers; the wire format is `YYYY-MM-DDTHH:MM:SSZ`."""

from __future__ import annotations

from datetime import datetime, timezone


def now_utc() -> datetime:
    """Current time as an aware UTC datetime."""
    return datetime.now(tz=timezone.utc)


def format_utc(moment: datetime) -> str:
    """Render an aware datetime as a `Z` suffixed instant, whole seconds."""
    return moment.astimezone(timezone.utc).replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_utc(text: str) -> datetime:
    """Parse `Z` or offset ISO instants into an aware UTC datetime."""
    cleaned = text.strip()
    if cleaned.endswith("Z"):
        cleaned = cleaned[:-1] + "+00:00"
    parsed = datetime.fromisoformat(cleaned)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)
