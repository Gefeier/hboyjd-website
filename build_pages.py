from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
INDEX_PATH = ROOT / "index.html"
ABOUT_PATH = ROOT / "about.html"
NEWS_PATH = ROOT / "news.html"
INDEX_JSON = ROOT / "content" / "index.json"


def main() -> None:
    if not INDEX_JSON.exists():
        print("content/index.json not found; skip index build")
        return
    data = json.loads(INDEX_JSON.read_text(encoding="utf-8-sig"))

    _build_index(data)
    _build_about(data)
    _build_news(data)


def _build_index(data: dict) -> None:
    hero = data.get("hero", {})
    about = data.get("about", {})
    html = INDEX_PATH.read_text(encoding="utf-8")

    # hero 区(沿用旧 class-based 替换,稳定)
    html = _replace_tag(html, "p", "hero-subtitle", hero.get("subtitle", ""), hero.get("subtitle_en", ""))
    html = _replace_tag(html, "h1", "hero-title", hero.get("title", ""), hero.get("title_en", ""))
    html = _replace_tag(html, "p", "hero-desc", hero.get("description", ""), hero.get("description_en", ""))
    if hero.get("poster"):
        html = re.sub(r'(<video class="hero-video"[^>]*poster=")[^"]*(")', rf'\g<1>{hero["poster"]}\2', html, count=1)
    if hero.get("video"):
        html = re.sub(r'(data-src=")[^"]*(")', rf'\g<1>{hero["video"]}\2', html, count=1)

    # about 区(走 data-cms-key 通用机制)
    for key, text_key, en_key in [
        ("about-title", "title", "title_en"),
        ("about-subtitle", "subtitle", "subtitle_en"),
        ("about-para1", "para1", "para1_en"),
        ("about-para2", "para2", "para2_en"),
    ]:
        html = _replace_by_cms_key(html, key, about.get(text_key, ""), about.get(en_key, ""))

    INDEX_PATH.write_text(html, encoding="utf-8")
    print("built index.html from content/index.json (hero + about)")


def _build_about(data: dict) -> None:
    """构建 about.html — Tier 1 19 字段全部走 data-cms-key 通用机制。"""
    about_page = data.get("about_page", {})
    if not about_page or not ABOUT_PATH.exists():
        return
    html = ABOUT_PATH.read_text(encoding="utf-8")
    keys = [
        "ab-hero-eyebrow", "ab-hero-title", "ab-hero-tagline",
        "ab-mission-eyebrow", "ab-mission-headline",
        "ab-stat-area", "ab-stat-employees", "ab-stat-capacity", "ab-stat-patents",
        "ab-give-back-1-title", "ab-give-back-1-body",
        "ab-give-back-2-title", "ab-give-back-2-body",
        "ab-give-back-3-title", "ab-give-back-3-body",
        "ab-cta-slogan", "ab-cta-title", "ab-cta-desc", "ab-cta-tagline",
        "ab-timeline-tag", "ab-timeline-title", "ab-timeline-desc",
        "ab-tech-tag", "ab-tech-title", "ab-tech-desc",
        "ab-adv-tag", "ab-adv-title", "ab-adv-desc",
        # Tier 2: tech 4 cards (12 fields) + adv 3 cards (9 fields)
        "ab-tech-card-1-eyebrow", "ab-tech-card-1-title", "ab-tech-card-1-body",
        "ab-tech-card-2-eyebrow", "ab-tech-card-2-title", "ab-tech-card-2-body",
        "ab-tech-card-3-eyebrow", "ab-tech-card-3-title", "ab-tech-card-3-body",
        "ab-tech-card-4-eyebrow", "ab-tech-card-4-title", "ab-tech-card-4-body",
        "ab-adv-card-1-eyebrow", "ab-adv-card-1-title", "ab-adv-card-1-body",
        "ab-adv-card-2-eyebrow", "ab-adv-card-2-title", "ab-adv-card-2-body",
        "ab-adv-card-3-eyebrow", "ab-adv-card-3-title", "ab-adv-card-3-body",
    ]
    applied = 0
    for key in keys:
        zh = about_page.get(key, "")
        en = about_page.get(f"{key}_en", "")
        before = html
        html = _replace_by_cms_key(html, key, zh, en)
        if html != before:
            applied += 1

    # Tier 2: timeline items 列表(数组)— 在 marker 之间整段重写
    timeline_items = data.get("timeline_items") or []
    if timeline_items:
        rendered = _render_timeline_items(timeline_items)
        pattern = re.compile(
            r'(<!-- TIMELINE_ITEMS_START -->)(.*?)(<!-- TIMELINE_ITEMS_END -->)',
            re.S,
        )
        new_html, n = pattern.subn(lambda m: f"{m.group(1)}\n{rendered}                {m.group(3)}", html)
        if n:
            html = new_html
            print(f"  + timeline_items rerendered ({len(timeline_items)} items)")
        else:
            print("  ! TIMELINE_ITEMS marker not found, skipped")

    ABOUT_PATH.write_text(html, encoding="utf-8")
    print(f"built about.html from content/index.json about_page ({applied}/{len(keys)} fields)")


def _render_timeline_items(items: list) -> str:
    """从 timeline_items 数组重新渲染 .timeline-item HTML(替 about.html 默认 fallback 内容)"""
    out = []
    for it in items:
        year = _html_escape(it.get("year", ""))
        title_zh = _html_escape(it.get("title", ""))
        title_en = _html_escape(it.get("title_en", ""))
        body_zh = _html_escape(it.get("body", ""))
        body_en = _html_escape(it.get("body_en", ""))
        out.append(
            '                <div class="timeline-item">\n'
            f'                    <div class="timeline-year">{year}</div>\n'
            '                    <div class="timeline-card">\n'
            f'                        <h3 data-en="{title_en}">{title_zh}</h3>\n'
            f'                        <p data-en="{body_en}">{body_zh}</p>\n'
            '                    </div>\n'
            '                </div>'
        )
    return "\n".join(out) + "\n"


def _build_news(data: dict) -> None:
    """构建 news.html — hero title + tagline 2 字段。"""
    news_page = data.get("news_page", {})
    if not news_page or not NEWS_PATH.exists():
        return
    html = NEWS_PATH.read_text(encoding="utf-8")
    keys = ["news-hero-title", "news-hero-tagline"]
    applied = 0
    for key in keys:
        zh = news_page.get(key, "")
        en = news_page.get(f"{key}_en", "")
        before = html
        html = _replace_by_cms_key(html, key, zh, en)
        if html != before:
            applied += 1
    NEWS_PATH.write_text(html, encoding="utf-8")
    print(f"built news.html from content/index.json news_page ({applied}/{len(keys)} fields)")


def _replace_tag(html: str, tag: str, class_name: str, text: str, text_en: str) -> str:
    if not text:
        return html
    escaped_text = _html_escape(text)
    escaped_en = _html_escape(text_en)
    pattern = rf'(<{tag}\s+class="{re.escape(class_name)}"\s+data-en=")[^"]*("[^>]*>)(.*?)(</{tag}>)'
    return re.sub(pattern, rf'\g<1>{escaped_en}\2{escaped_text}\4', html, count=1, flags=re.S)


def _replace_by_cms_key(html: str, key: str, text: str, text_en: str) -> str:
    """通用替换:任意标签 + data-cms-key="key" + data-en="..." 的元素,改 textContent+data-en。"""
    if text is None and text_en is None:
        return html
    pattern = re.compile(
        r'(<[^>]+\bdata-cms-key="' + re.escape(key) + r'"[^>]*\bdata-en=")([^"]*)("[^>]*>)(.*?)(</[a-zA-Z][^>]*>)',
        re.S,
    )
    def repl(match: re.Match) -> str:
        prefix, old_en, suffix, old_text, close = match.groups()
        new_en = _html_escape(text_en) if text_en else old_en
        new_text = _html_escape(text) if text else old_text  # 空文本保留原值
        return f"{prefix}{new_en}{suffix}{new_text}{close}"
    return pattern.sub(repl, html, count=1)


def _html_escape(value: str) -> str:
    return (
        str(value)
        .replace("&", "&amp;")
        .replace('"', "&quot;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


if __name__ == "__main__":
    main()
