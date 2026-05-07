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
    html = INDEX_PATH.read_text(encoding="utf-8")
    html = _replace_tag(html, "p", "hero-subtitle", hero.get("subtitle", ""), hero.get("subtitle_en", ""))
    html = _replace_tag(html, "h1", "hero-title", hero.get("title", ""), hero.get("title_en", ""))
    html = _replace_tag(html, "p", "hero-desc", hero.get("description", ""), hero.get("description_en", ""))
    if hero.get("poster"):
        html = re.sub(r'(<video class="hero-video"[^>]*poster=")[^"]*(")', rf'\g<1>{hero["poster"]}\2', html, count=1)
    if hero.get("video"):
        html = re.sub(r'(data-src=")[^"]*(")', rf'\g<1>{hero["video"]}\2', html, count=1)
    INDEX_PATH.write_text(html, encoding="utf-8")
    print("built index.html from content/index.json")


def _replace_tag(html: str, tag: str, class_name: str, text: str, text_en: str) -> str:
    if not text:
        return html
    escaped_text = _html_escape(text)
    escaped_en = _html_escape(text_en)
    pattern = rf'(<{tag}\s+class="{re.escape(class_name)}"\s+data-en=")[^"]*("[^>]*>)(.*?)(</{tag}>)'
    return re.sub(pattern, rf'\g<1>{escaped_en}\2{escaped_text}\4', html, count=1, flags=re.S)


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
