"""中→英自动翻译。

支持双 provider:
- MINIMAX_API_KEY → minimax abab6.5s-chat(国内快,便宜,优先)
- ANTHROPIC_API_KEY → Claude haiku-4-5(海外,质量略高)

env 里有哪个 key 用哪个。两个都没配 raise RuntimeError 走前端友好提示。
凭证存 /etc/admin-backend/credentials.env(root 600,不进 Git)。
"""
from __future__ import annotations

import json
import os
import re

import requests


PROMPT_TEMPLATE = """把下列中文翻译成英文,语境是中国半挂车制造企业(欧阳聚德)官网首页 Hero 标语。要求:

1. 简短有力,品牌感
2. 行业术语保留(T700C 钢材直接保留 "T700C steel"、半挂车 = "semi-trailer")
3. 描述类要具体明确,讲产品价值,不空洞
4. 主标语用专业有力的措辞(power words)
5. 副标语保留已有英文短语(如"DREAM ON THE ROAD"已是英文,直接保留)

只返回纯净 JSON 对象,key 是输入的 key,value 是英文译文。**不要任何 markdown 围栏 / 解释 / 注释**。

例:{{"title": "English text", "subtitle": "...", "desc": "..."}}

要翻译的内容:
{bullets}"""


def translate_batch(items: list[dict]) -> dict[str, str]:
    """items=[{"key":"title","text":"中文"},...] → {"title":"English",...}"""
    items = [it for it in items if (it.get("text") or "").strip()]
    if not items:
        return {}

    bullets = "\n".join(
        f'{i+1}. key="{it["key"]}" text="""{it["text"]}"""'
        for i, it in enumerate(items)
    )
    prompt = PROMPT_TEMPLATE.format(bullets=bullets)

    if os.getenv("MINIMAX_API_KEY", "").strip():
        return _call_minimax(prompt)
    if os.getenv("ANTHROPIC_API_KEY", "").strip():
        return _call_anthropic(prompt)
    raise RuntimeError("MINIMAX_API_KEY 或 ANTHROPIC_API_KEY 未配置 — 联系墨在 /etc/admin-backend/credentials.env 加 key")


def _call_minimax(prompt: str) -> dict[str, str]:
    api_key = os.getenv("MINIMAX_API_KEY", "").strip()
    model = os.getenv("MINIMAX_MODEL", "abab6.5s-chat")
    r = requests.post(
        "https://api.minimaxi.com/v1/text/chatcompletion_v2",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1024,
            "temperature": 0.3,
        },
        timeout=30,
    )
    if r.status_code != 200:
        raise RuntimeError(f"minimax {r.status_code}: {r.text[:300]}")
    data = r.json()
    text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    return _parse_json_response(text, "minimax")


def _call_anthropic(prompt: str) -> dict[str, str]:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    model = os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5")
    r = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=30,
    )
    if r.status_code != 200:
        raise RuntimeError(f"anthropic {r.status_code}: {r.text[:300]}")
    data = r.json()
    text = (data.get("content") or [{}])[0].get("text", "").strip()
    return _parse_json_response(text, "anthropic")


def _parse_json_response(text: str, provider: str) -> dict[str, str]:
    text = (text or "").strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        raise RuntimeError(f"{provider} 返回不是 JSON: {text[:200]}")
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"{provider} JSON 解析失败 ({exc}): {text[:200]}")
