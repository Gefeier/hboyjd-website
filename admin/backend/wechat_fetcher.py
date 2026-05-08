from __future__ import annotations

import html
import json
import os
import re
import subprocess
from datetime import date
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

import requests


def fetch_wechat_article(url: str) -> dict[str, Any]:
    url = url.strip()
    parsed = urlparse(url)
    if parsed.netloc not in {"mp.weixin.qq.com", "mp.weixin.qq.com.cn"}:
        raise ValueError("只支持 mp.weixin.qq.com 公众号文章链接")

    external = _fetch_with_sync_script(url)
    if external:
        return _normalize_external_article(external, url)

    response = requests.get(
        url,
        timeout=12,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "Referer": "https://mp.weixin.qq.com/",
        },
    )
    response.raise_for_status()
    response.encoding = response.apparent_encoding or "utf-8"
    text = response.text

    title = _first_meta(text, ["og:title", "twitter:title"]) or _first_match(text, r"<title[^>]*>(.*?)</title>")
    title = _clean(title).replace(" - 微信公众平台", "").strip()
    summary = _first_meta(text, ["description", "og:description"]) or ""
    cover = _first_meta(text, ["og:image", "twitter:image"]) or _first_match(text, r'var\s+msg_cdn_url\s*=\s*"([^"]+)"')

    # 严格校验:抓不到 og:title 多半是假 URL 或文章删除/未公开,拒绝 silently 兜底
    if not title or title in {"微信公众平台", "微信公众号文章", "Error"}:
        raise ValueError(f"未抓到文章标题,可能是无效 URL / 文章已删除 / 未公开: {url}")
    publish_date = (
        _first_match(text, r'var\s+publish_time\s*=\s*"([^"]+)"')
        or _first_match(text, r'"publish_time"\s*:\s*"([^"]+)"')
        or date.today().isoformat()
    )
    if re.fullmatch(r"\d{10}", publish_date or ""):
        publish_date = date.fromtimestamp(int(publish_date)).isoformat()

    return {
        "id": _article_id(url),
        "title": title or "未命名公众号文章",
        "title_en": "",
        "summary": _clean(summary)[:180],
        "summary_en": "",
        "date": publish_date[:10],
        "category": "company",
        "category_label": "公司动态",
        "category_label_en": "Company News",
        "url": url,
        "cover": html.unescape(cover or ""),
        "source": "wechat",
    }


def _first_meta(text: str, keys: list[str]) -> str:
    for key in keys:
        patterns = [
            rf'<meta[^>]+property=["\']{re.escape(key)}["\'][^>]+content=["\']([^"\']+)["\']',
            rf'<meta[^>]+name=["\']{re.escape(key)}["\'][^>]+content=["\']([^"\']+)["\']',
            rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']{re.escape(key)}["\']',
            rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']{re.escape(key)}["\']',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.I | re.S)
            if match:
                return html.unescape(match.group(1))
    return ""


def _first_match(text: str, pattern: str) -> str:
    match = re.search(pattern, text, re.I | re.S)
    return html.unescape(match.group(1)) if match else ""


def _clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value or "")
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def _article_id(url: str) -> str:
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    token = ""
    path_parts = [part for part in parsed.path.split("/") if part]
    if len(path_parts) >= 2 and path_parts[0] == "s":
        token = path_parts[-1]
    if not token or token == "s":
        token = (query.get("sn") or query.get("mid") or [""])[0]
    token = re.sub(r"[^A-Za-z0-9_-]+", "", token)
    return f"wx-{token[:16] or 'article'}"


def _fetch_with_sync_script(url: str) -> dict[str, Any] | None:
    script = Path(os.getenv("WECHAT_SYNC_SCRIPT", "/opt/wechat-sync/sync.py"))
    if not script.exists():
        return None
    runner = os.getenv("WECHAT_SYNC_PYTHON", "python3")
    result = subprocess.run(
        [runner, str(script), url],
        text=True,
        capture_output=True,
        timeout=40,
        check=False,
    )
    if result.returncode != 0:
        return None
    text = result.stdout.strip()
    if not text:
        return None
    for candidate in _json_candidates(text):
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(data, list) and data:
            data = data[0]
        if isinstance(data, dict):
            return data
    return None


def _json_candidates(text: str) -> list[str]:
    candidates = [text]
    first_obj = text.find("{")
    last_obj = text.rfind("}")
    if first_obj >= 0 and last_obj > first_obj:
        candidates.append(text[first_obj:last_obj + 1])
    first_arr = text.find("[")
    last_arr = text.rfind("]")
    if first_arr >= 0 and last_arr > first_arr:
        candidates.append(text[first_arr:last_arr + 1])
    return candidates


def _normalize_external_article(data: dict[str, Any], url: str) -> dict[str, Any]:
    title = data.get("title") or data.get("msg_title") or data.get("name") or "未命名公众号文章"
    summary = data.get("summary") or data.get("description") or data.get("digest") or data.get("msg_desc") or ""
    cover = data.get("cover") or data.get("cover_url") or data.get("image") or data.get("msg_cdn_url") or ""
    raw_date = str(data.get("date") or data.get("publish_date") or data.get("publish_time") or data.get("create_time") or "")
    if re.fullmatch(r"\d{10}", raw_date):
        raw_date = date.fromtimestamp(int(raw_date)).isoformat()
    return {
        "id": data.get("id") or _article_id(url),
        "title": _clean(str(title)),
        "title_en": data.get("title_en", ""),
        "summary": _clean(str(summary))[:180],
        "summary_en": data.get("summary_en", ""),
        "date": raw_date[:10] or date.today().isoformat(),
        "category": data.get("category", "company"),
        "category_label": data.get("category_label", "公司动态"),
        "category_label_en": data.get("category_label_en", "Company News"),
        "url": data.get("url") or url,
        "cover": str(cover),
        "source": "wechat",
    }
