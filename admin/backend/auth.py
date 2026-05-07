from __future__ import annotations

import os
from typing import Any

from flask import session


AUTH_MODE = os.getenv("ADMIN_AUTH_MODE", "mock").lower()


def current_user() -> dict[str, Any] | None:
    if AUTH_MODE == "mock":
        return session.get("user") or {
            "userid": "demo",
            "name": "市场部演示账号",
            "role": "admin",
            "auth_mode": "mock",
        }
    return session.get("user")


def require_user() -> dict[str, Any]:
    user = current_user()
    if not user:
        raise PermissionError("unauthorized")
    return user


def qrcode_payload() -> dict[str, Any]:
    corp_id = os.getenv("DINGTALK_CORP_ID", "")
    agent_id = os.getenv("DINGTALK_AGENT_ID", "")
    redirect_uri = os.getenv("DINGTALK_REDIRECT_URI", "")
    if AUTH_MODE == "mock":
        return {
            "mode": "mock",
            "url": "",
            "message": "本地演示模式：点击进入工作台即可。",
        }
    if not corp_id or not agent_id or not redirect_uri:
        return {
            "mode": "dingtalk",
            "url": "",
            "message": "缺少钉钉 corpId/agentId/redirectUri，暂不能生成扫码地址。",
        }
    return {
        "mode": "dingtalk",
        "url": (
            "https://login.dingtalk.com/oauth2/auth?"
            f"redirect_uri={redirect_uri}&response_type=code&client_id={agent_id}"
            "&scope=openid&state=hboyjd-admin&prompt=consent"
        ),
        "message": "",
    }


def login_from_callback(payload: dict[str, Any]) -> dict[str, Any]:
    if AUTH_MODE == "mock":
        user = {
            "userid": payload.get("userid") or "demo",
            "name": payload.get("name") or "市场部演示账号",
            "role": "admin",
            "auth_mode": "mock",
        }
        session["user"] = user
        return user
    raise NotImplementedError("钉钉正式回调需要接入 corpId/agentId/appSecret 后启用。")
