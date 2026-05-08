from __future__ import annotations

import os
from typing import Any
from urllib.parse import urlencode

import requests
from flask import session


AUTH_MODE = os.getenv("ADMIN_AUTH_MODE", "mock").lower()
DINGTALK_API_BASE = "https://api.dingtalk.com"


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
    app_key = os.getenv("DINGTALK_APP_KEY") or os.getenv("DINGTALK_CLIENT_ID") or os.getenv("DINGTALK_AGENT_ID", "")
    redirect_uri = os.getenv("DINGTALK_REDIRECT_URI", "")
    if AUTH_MODE == "mock":
        return {
            "mode": "mock",
            "url": "",
            "message": "本地演示模式：点击进入工作台即可。",
        }
    if not app_key or not redirect_uri:
        return {
            "mode": "dingtalk",
            "url": "",
            "message": "缺少钉钉 AppKey/redirectUri，暂不能生成扫码地址。",
        }
    params = {
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "client_id": app_key,
        "scope": os.getenv("DINGTALK_OAUTH_SCOPE", "openid"),
        "state": os.getenv("DINGTALK_OAUTH_STATE", "hboyjd-admin"),
        "prompt": "consent",
    }
    if corp_id and params["scope"] == "openid corpid":
        params["corpId"] = corp_id
    return {
        "mode": "dingtalk",
        "url": "https://login.dingtalk.com/oauth2/auth?" + urlencode(params),
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

    code = payload.get("code") or payload.get("authCode")
    if not code:
        raise ValueError("缺少钉钉回调 code/authCode")

    app_key = os.getenv("DINGTALK_APP_KEY") or os.getenv("DINGTALK_CLIENT_ID")
    app_secret = os.getenv("DINGTALK_APP_SECRET") or os.getenv("DINGTALK_CLIENT_SECRET")
    if not app_key or not app_secret:
        raise ValueError("缺少钉钉 DINGTALK_APP_KEY/DINGTALK_APP_SECRET")

    token_payload = {
        "clientId": app_key,
        "clientSecret": app_secret,
        "code": code,
        "grantType": "authorization_code",
    }
    token_data = _dingtalk_post("/v1.0/oauth2/userAccessToken", token_payload)
    access_token = token_data.get("accessToken")
    if not access_token:
        raise ValueError(f"钉钉未返回 accessToken: {_compact_error(token_data)}")

    profile = _dingtalk_get("/v1.0/contact/users/me", access_token)
    userid = (
        profile.get("userid")
        or profile.get("userId")
        or profile.get("openId")
        or profile.get("unionId")
    )
    name = (
        profile.get("name")
        or profile.get("nick")
        or profile.get("nickname")
        or profile.get("mobile")
        or userid
    )
    if not userid:
        raise ValueError(f"钉钉未返回用户身份: {_compact_error(profile)}")

    user = {
        "userid": userid,
        "name": name,
        "role": "admin",
        "auth_mode": "dingtalk",
        "unionid": profile.get("unionId"),
        "openid": profile.get("openId"),
        "mobile": profile.get("mobile"),
        "avatar_url": profile.get("avatarUrl"),
    }
    _assert_allowed(user)
    session["user"] = user
    return user


def _dingtalk_post(path: str, body: dict[str, Any]) -> dict[str, Any]:
    response = requests.post(
        f"{DINGTALK_API_BASE}{path}",
        json=body,
        headers={"Content-Type": "application/json"},
        timeout=12,
    )
    return _parse_dingtalk_response(response)


def _dingtalk_get(path: str, access_token: str) -> dict[str, Any]:
    response = requests.get(
        f"{DINGTALK_API_BASE}{path}",
        headers={"x-acs-dingtalk-access-token": access_token},
        timeout=12,
    )
    return _parse_dingtalk_response(response)


def _parse_dingtalk_response(response: requests.Response) -> dict[str, Any]:
    try:
        data = response.json()
    except ValueError as exc:
        raise ValueError(f"钉钉接口返回非 JSON: HTTP {response.status_code}") from exc
    if response.status_code >= 400:
        raise ValueError(f"钉钉接口 HTTP {response.status_code}: {_compact_error(data)}")
    err_code = data.get("errcode") or data.get("code")
    if err_code not in (None, 0, "0", "OK", "ok"):
        raise ValueError(f"钉钉接口报错: {_compact_error(data)}")
    return data


def _assert_allowed(user: dict[str, Any]) -> None:
    raw = os.getenv("ADMIN_ALLOWED_DINGTALK_USERS", "").strip()
    if not raw:
        return
    allowed = {item.strip() for item in raw.replace(";", ",").split(",") if item.strip()}
    candidates = {
        str(user.get("userid") or ""),
        str(user.get("unionid") or ""),
        str(user.get("openid") or ""),
        str(user.get("mobile") or ""),
    }
    if allowed.isdisjoint(candidates):
        raise PermissionError("当前钉钉用户不在后台白名单")


def _compact_error(data: dict[str, Any]) -> str:
    parts = []
    for key in ("errcode", "code", "errmsg", "message", "requestid"):
        if data.get(key) not in (None, ""):
            parts.append(f"{key}={data.get(key)}")
    return ", ".join(parts) or str(data)[:240]
