from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
INDEX_PATH = ROOT / "index.html"
INDEX_JSON = ROOT / "content" / "index.json"


def main() -> None:
    if not INDEX_JSON.exists():
        print("content/index.json not found; skip index build")
        return
    data = json.loads(INDEX_JSON.read_text(encoding="utf-8-sig"))
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

    # about 区(走 data-cms-key 通用机制,扩字段时不用改 build_pages,只 HTML 加 attribute + json 加 key)
    for key, text_key, en_key in [
        ("about-title", "title", "title_en"),
        ("about-subtitle", "subtitle", "subtitle_en"),
        ("about-para1", "para1", "para1_en"),
        ("about-para2", "para2", "para2_en"),
    ]:
        html = _replace_by_cms_key(html, key, about.get(text_key, ""), about.get(en_key, ""))

    INDEX_PATH.write_text(html, encoding="utf-8")
    print("built index.html from content/index.json (hero + about)")


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
