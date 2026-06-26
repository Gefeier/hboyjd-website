"""创作工坊后端 IO + 模板引擎
- 模板存放: REPO_ROOT/admin/workshop/templates/*.json + *.html
- 草稿存放: REPO_ROOT/content/originals/draft-<id>.json
- 已发布: 进 news.json 主池 (source="original", body=渲染好的 HTML)
  正文 body 副本也同步写到 content/originals/<id>.json,供回溯/重渲染
"""
from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from typing import Any

from content_io import REPO_ROOT, append_news, read_section, write_section


TEMPLATES_DIR = REPO_ROOT / "admin" / "workshop" / "templates"
ORIGINALS_DIR = REPO_ROOT / "content" / "originals"
DRAFTS_PREFIX = "draft-"


def _ensure_dirs() -> None:
    TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    ORIGINALS_DIR.mkdir(parents=True, exist_ok=True)


# ---------- 模板 ----------

def list_templates() -> list[dict[str, Any]]:
    _ensure_dirs()
    out: list[dict[str, Any]] = []
    for path in sorted(TEMPLATES_DIR.glob("*.json")):
        try:
            meta = json.loads(path.read_text(encoding="utf-8"))
            out.append({
                "template_id": meta.get("template_id", path.stem),
                "name": meta.get("name", path.stem),
                "category": meta.get("category", ""),
                "category_label": meta.get("category_label", ""),
                "summary": meta.get("summary", ""),
            })
        except Exception:
            continue
    return out


def get_template(template_id: str) -> dict[str, Any]:
    _ensure_dirs()
    path = TEMPLATES_DIR / f"{_safe_name(template_id)}.json"
    if not path.exists():
        raise ValueError(f"模板不存在: {template_id}")
    meta = json.loads(path.read_text(encoding="utf-8"))
    render_path = TEMPLATES_DIR / meta.get("render", f"{template_id}.html")
    meta["render_template"] = render_path.read_text(encoding="utf-8") if render_path.exists() else ""
    return meta


# ---------- 模板引擎 ----------
# 支持: {{key}} {{html:key}} {{images:key}} {{#if k}}...{{/if}}
# 跟 admin/workshop.js 前端引擎保持等价(用同一份模板)
import markdown_lite  # 见下文,本地极简 markdown 子集


def _safe_attr(s: str) -> str:
    return (str(s)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;"))


def render_body(template_text: str, ctx: dict[str, Any]) -> str:
    out = template_text

    # 1) 条件块
    def _cond(match: re.Match) -> str:
        key = match.group(1)
        inner = match.group(2)
        val = ctx.get(key)
        truthy = bool(val) and not (isinstance(val, list) and len(val) == 0)
        return inner if truthy else ""

    out = re.sub(r"\{\{#if\s+([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{/if\}\}", _cond, out)

    # 2) 图集 {{images:key}}
    def _images(match: re.Match) -> str:
        key = match.group(1)
        urls = ctx.get(key) or []
        if not isinstance(urls, list):
            return ""
        return "\n".join(f'<img src="{_safe_attr(u)}" alt="">' for u in urls)

    out = re.sub(r"\{\{images:([a-zA-Z0-9_]+)\}\}", _images, out)

    # 3) markdown {{html:key}}
    def _html(match: re.Match) -> str:
        key = match.group(1)
        md = ctx.get(key) or ""
        if not md:
            return ""
        return markdown_lite.render(str(md))

    out = re.sub(r"\{\{html:([a-zA-Z0-9_]+)\}\}", _html, out)

    # 4) 纯文本 {{key}}
    def _text(match: re.Match) -> str:
        key = match.group(1)
        val = ctx.get(key)
        if val is None:
            return ""
        return _safe_attr(str(val))

    out = re.sub(r"\{\{([a-zA-Z0-9_]+)\}\}", _text, out)

    return out


# ---------- 草稿 ----------

def list_drafts() -> list[dict[str, Any]]:
    _ensure_dirs()
    out: list[dict[str, Any]] = []
    for p in sorted(ORIGINALS_DIR.glob(f"{DRAFTS_PREFIX}*.json"), reverse=True):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            out.append({
                "id": data.get("id"),
                "template_id": data.get("template_id"),
                "category": data.get("category"),
                "date": data.get("date"),
                "fields": data.get("fields", {}),
            })
        except Exception:
            continue
    return out


def save_draft(payload: dict[str, Any]) -> dict[str, Any]:
    _ensure_dirs()
    item_id = _safe_name(payload.get("id", ""))
    if not item_id:
        raise ValueError("缺少 id")
    path = ORIGINALS_DIR / f"{DRAFTS_PREFIX}{item_id}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"ok": True, "draft_path": str(path.relative_to(REPO_ROOT)), "id": item_id}


def publish(payload: dict[str, Any]) -> dict[str, Any]:
    """发布: 渲染 body → 写 news.json (source=original) + content/originals/<id>.json 备份
    两种模式:
    - mode="ai" (v2): body 字段直接来自 payload['body'] (编辑器 contenteditable 出的 HTML), 不走模板渲染
    - mode="structured" (v1, 默认): 用模板 + fields 渲染 body
    """
    _ensure_dirs()
    item_id = _safe_name(payload.get("id", ""))
    if not item_id:
        raise ValueError("缺少 id")

    mode = payload.get("mode") or "structured"

    if mode == "ai":
        # v2 AI 主笔模式: payload 已含 body/title/summary/cover/category
        body_html = payload.get("body", "")
        title = (payload.get("title") or "").strip() or "(无标题)"
        summary = (payload.get("summary") or "").strip()
        if len(summary) > 120:
            summary = summary[:120] + "…"
        cover = payload.get("cover", "")
        category = payload.get("category") or "company"
        category_label = payload.get("category_label") or category
        template_id = payload.get("template_id", "ai-freeform")
        category_label_en = ""
        when = payload.get("date") or date.today().isoformat()
    else:
        template_id = payload.get("template_id", "")
        if not template_id:
            raise ValueError("缺少 template_id")
        template = get_template(template_id)
        fields = payload.get("fields") or {}
        category = payload.get("category") or template.get("category") or "company"
        category_label = payload.get("category_label") or template.get("category_label") or category
        when = payload.get("date") or date.today().isoformat()
        ctx = {**fields, "category": category, "category_label": category_label}
        body_html = render_body(template.get("render_template", ""), ctx)
        title = fields.get("title", "").strip() or "(无标题)"
        summary = (fields.get("subtitle") or fields.get("intro") or "").strip()
        if len(summary) > 120:
            summary = summary[:120] + "…"
        cover = fields.get("cover", "")
        category_label_en = template.get("meta_defaults", {}).get("category_label_en", "")

    article = {
        "id": item_id,
        "title": title,
        "title_en": "",
        "summary": summary,
        "summary_en": "",
        "date": when,
        "category": category,
        "category_label": category_label,
        "category_label_en": category_label_en,
        "url": f"/news-detail.html?id={item_id}",
        "cover": cover,
        "source": "original",
        "template": template_id,
        "body": body_html,
        "site_visible": True,
    }
    # 写主池
    saved, inserted = append_news(article)
    # 副本(供后续重渲染/迁移)
    backup_path = ORIGINALS_DIR / f"{item_id}.json"
    backup_path.write_text(json.dumps({
        **payload,
        "rendered_at": date.today().isoformat(),
        "article": saved,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # 删掉对应草稿(如果有)
    draft_path = ORIGINALS_DIR / f"{DRAFTS_PREFIX}{item_id}.json"
    if draft_path.exists():
        draft_path.unlink()

    public_url = f"https://hboyjd.com/news-detail.html?id={item_id}"
    return {
        "ok": True,
        "id": item_id,
        "inserted": inserted,
        "public_url": public_url,
        "article": saved,
    }


def _safe_name(s: str) -> str:
    s = (s or "").strip()
    # 只允许字母数字 - _
    return re.sub(r"[^a-zA-Z0-9_\-]", "", s)
