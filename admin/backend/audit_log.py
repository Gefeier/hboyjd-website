from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _default_log_path() -> Path:
    here = Path(__file__).resolve()
    return here.parent / "logs" / "admin-actions.jsonl"


LOG_PATH = Path(os.getenv("ADMIN_ACTION_LOG", str(_default_log_path())))


def append_log(user: dict[str, Any] | None, action: str, target: str, diff_summary: str = "") -> dict[str, Any]:
    entry = {
        "ts": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "user": (user or {}).get("name") or (user or {}).get("userid") or "demo",
        "action": action,
        "target": target,
        "diff_summary": diff_summary,
    }
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def read_logs(limit: int = 50) -> list[dict[str, Any]]:
    if not LOG_PATH.exists():
        return []
    lines = LOG_PATH.read_text(encoding="utf-8").splitlines()
    rows: list[dict[str, Any]] = []
    for line in lines[-max(limit, 1):]:
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return list(reversed(rows))
