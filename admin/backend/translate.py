"""中→英自动翻译,走 Anthropic Claude haiku API。

需要环境变量 ANTHROPIC_API_KEY(在 /etc/admin-backend/credentials.env)。
没配置时 raise RuntimeError 走前端友好提示。
"""
from __future__ import annotations

import json
import os
import re

import requests


MODEL = "claude-haiku-4-5"
API_URL = "https://api.anthropic.com/v1/messages"


def translate_batch(items: list[dict]) -> dict[str, str]:
    """items=[{"key": "title", "text": "中文"}, ...] → {"title": "English", ...}"""
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY 未配置 — 联系墨在 /etc/admin-backend/credentials.env 加 key")

    items = [it for it in items if (it.get("text") or "").strip()]
    if not items:
        return {}

    bullets = "\n".join(
        f'{i+1}. key="{it["key"]}" text="""{it["text"]}"""'
        for i, it in enumerate(items)
    )

    prompt = f"""把下列中文翻译成英文,语境是中国半挂车制造企业(欧阳聚德)官网首页 Hero 标语。要求:

1. 简短有力,品牌感
2. 行业术语保留(T700C 钢材直接保留 "T700C steel"、半挂车 = "semi-trailer")
3. 描述类要具体明确,讲产品价值,不空洞
4. 主标语用专业有力的措辞(power words)
5. 副标语保留已有英文短语(如"DREAM ON THE ROAD"已是英文,直接保留)

只返回纯净 JSON 对象,key 是输入的 key,value 是英文译文。**不要任何 markdown 围栏 / 解释 / 注释**。

例:{{"title": "English text", "subtitle": "...", "desc": "..."}}

要翻译的内容:
{bullets}"""

    r = requests.post(
        API_URL,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": MODEL,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=30,
    )

    if r.status_code != 200:
        raise RuntimeError(f"Anthropic API {r.status_code}: {r.text[:300]}")

    data = r.json()
    text = (data.get("content") or [{}])[0].get("text", "").strip()

    # 提取 JSON(防 Claude 在前后加 markdown 围栏)
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    # 找最大的 {...} 块
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        raise RuntimeError(f"Claude 返回不是 JSON: {text[:200]}")

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"JSON 解析失败: {exc}; 原文: {text[:200]}")
