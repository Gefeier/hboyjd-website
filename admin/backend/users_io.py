"""用户账号文件读写 + 创建 / 更新 / 停用。

文件格式 (USERS_FILE,默认 /etc/admin-backend/users.json,root 600):
{
  "lily": {
    "name": "欧阳俊丽",
    "role": "admin",
    "password_hash": "pbkdf2:sha256:600000$...",
    "disabled": false,
    "created_at": "2026-05-08T10:00:00+08:00",
    "last_login": null
  },
  ...
}

写入走原子 rename + threading.Lock,Flask 单进程单 worker 够用。
"""
from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timezone
from typing import Any

from werkzeug.security import generate_password_hash

ROLES = ("admin", "editor")
MIN_PASSWORD_LEN = 6
_lock = threading.Lock()


def _users_path() -> str:
    return os.getenv("ADMIN_USERS_FILE", "")


def _now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def _read_raw() -> dict[str, dict[str, Any]]:
    path = _users_path()
    if not path or not os.path.exists(path):
        return {}
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def _write_raw(data: dict[str, dict[str, Any]]) -> None:
    path = _users_path()
    if not path:
        raise RuntimeError("ADMIN_USERS_FILE 未配置")
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
    try:
        os.chmod(tmp, 0o600)
    except OSError:
        pass
    os.replace(tmp, path)


def _safe_view(userid: str, rec: dict[str, Any]) -> dict[str, Any]:
    return {
        "userid": userid,
        "name": rec.get("name", ""),
        "role": rec.get("role", "editor"),
        "disabled": bool(rec.get("disabled", False)),
        "created_at": rec.get("created_at"),
        "last_login": rec.get("last_login"),
    }


def list_users() -> list[dict[str, Any]]:
    users = _read_raw()
    return [_safe_view(uid, rec) for uid, rec in sorted(users.items())]


def get(userid: str) -> dict[str, Any] | None:
    rec = _read_raw().get(userid)
    return rec if rec else None


def get_safe(userid: str) -> dict[str, Any] | None:
    rec = get(userid)
    return _safe_view(userid, rec) if rec else None


def _validate_role(role: str) -> str:
    role = (role or "").strip().lower()
    if role not in ROLES:
        raise ValueError(f"角色必须是: {' / '.join(ROLES)}")
    return role


def _validate_password(password: str) -> None:
    if not password or len(password) < MIN_PASSWORD_LEN:
        raise ValueError(f"密码至少 {MIN_PASSWORD_LEN} 位")


def _validate_userid(userid: str) -> str:
    userid = (userid or "").strip()
    if not userid or not userid.replace("-", "").replace("_", "").isalnum():
        raise ValueError("账号只允许英文 / 数字 / 下划线 / 横杠")
    if len(userid) > 32:
        raise ValueError("账号不超过 32 位")
    return userid


def create(userid: str, name: str, role: str, password: str) -> dict[str, Any]:
    userid = _validate_userid(userid)
    name = (name or "").strip()
    if not name:
        raise ValueError("姓名不能为空")
    role = _validate_role(role)
    _validate_password(password)

    with _lock:
        users = _read_raw()
        if userid in users:
            raise ValueError("账号已存在")
        users[userid] = {
            "name": name,
            "role": role,
            "password_hash": generate_password_hash(password),
            "disabled": False,
            "created_at": _now_iso(),
            "last_login": None,
        }
        _write_raw(users)
    return _safe_view(userid, users[userid])


def update(userid: str, **changes: Any) -> dict[str, Any]:
    """支持改:name / role / password(明文) / disabled / last_login。"""
    with _lock:
        users = _read_raw()
        if userid not in users:
            raise ValueError("账号不存在")
        rec = dict(users[userid])
        if "name" in changes:
            new_name = (changes["name"] or "").strip()
            if not new_name:
                raise ValueError("姓名不能为空")
            rec["name"] = new_name
        if "role" in changes:
            rec["role"] = _validate_role(changes["role"])
        if "password" in changes:
            _validate_password(changes["password"])
            rec["password_hash"] = generate_password_hash(changes["password"])
        if "disabled" in changes:
            rec["disabled"] = bool(changes["disabled"])
        if "last_login" in changes:
            rec["last_login"] = changes["last_login"]
        users[userid] = rec
        _write_raw(users)
    return _safe_view(userid, rec)


def touch_login(userid: str) -> None:
    try:
        update(userid, last_login=_now_iso())
    except Exception:
        pass
