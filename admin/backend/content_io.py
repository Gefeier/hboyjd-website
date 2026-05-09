from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any


REPO_ROOT = Path(os.getenv("HBOYJD_REPO_ROOT", Path(__file__).resolve().parents[2])).resolve()
CONTENT_DIR = REPO_ROOT / "content"
NEWS_PATH = REPO_ROOT / "news.json"
IMAGES_MANIFEST = CONTENT_DIR / "images-manifest.json"
ALLOWED_SECTIONS = {"index", "about", "timeline", "honors", "tags", "news"}


DEFAULT_INDEX = {
    "hero": {
        "subtitle": "DREAM ON THE ROAD · 为梦出发",
        "subtitle_en": "DREAM ON THE ROAD",
        "title": "半挂车研发制造专家",
        "title_en": "Semi-Trailer R&D & Manufacturing Expert",
        "description": "T700C高强度钢材 · 全系定制化生产 · 品质铸就未来",
        "description_en": "T700C High-Strength Steel · Fully Customized Production · Quality Builds the Future",
        "image": "assets/images/factory-gate.webp",
        "poster": "assets/videos/hero-factory-poster.jpg",
        "video": "assets/videos/hero-factory.mp4",
    }
}


def ensure_content_files() -> None:
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    defaults: dict[str, Any] = {
        "index": DEFAULT_INDEX,
        "about": {"status": "phase-1.5", "note": "v1 只开放首页 banner/news/images，about 全量模板化后再开放。"},
        "timeline": [],
        "honors": [],
        "tags": ["company", "gov", "case"],
    }
    for section, data in defaults.items():
        path = _section_path(section)
        if not path.exists():
            write_json(path, data)
    if not IMAGES_MANIFEST.exists():
        write_json(IMAGES_MANIFEST, scan_images())


def _section_path(section: str) -> Path:
    if section == "news":
        return NEWS_PATH
    if section not in ALLOWED_SECTIONS:
        raise ValueError(f"unsupported section: {section}")
    return CONTENT_DIR / f"{section}.json"


def read_json(path: Path, fallback: Any = None) -> Any:
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2)
    path.write_text(text + "\n", encoding="utf-8")


def read_section(section: str) -> Any:
    ensure_content_files()
    fallback: Any = [] if section in {"news", "timeline", "honors"} else {}
    return read_json(_section_path(section), fallback)


def write_section(section: str, data: Any) -> None:
    if section not in ALLOWED_SECTIONS:
        raise ValueError(f"unsupported section: {section}")
    write_json(_section_path(section), data)


def append_news(article: dict[str, Any]) -> tuple[dict[str, Any], bool]:
    news = read_section("news")
    url = article.get("url", "").strip()
    for idx, item in enumerate(news):
        if url and item.get("url") == url:
            merged = {**item}
            today = date.today().isoformat()
            for key, value in article.items():
                if value in {"", None}:
                    continue
                if key == "date" and value == today and item.get("date"):
                    continue
                merged[key] = value
            news[idx] = merged
            write_section("news", news)
            return merged, False
    news.insert(0, article)
    write_section("news", news)
    return article, True


def scan_images() -> list[dict[str, Any]]:
    roots = [REPO_ROOT / "assets" / "images" / "about", REPO_ROOT / "assets" / "images"]
    by_base: dict[str, dict[str, Any]] = {}
    for root in roots:
        if not root.exists():
            continue
        for path in root.iterdir():
            if not path.is_file() or path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
                continue
            rel = path.relative_to(REPO_ROOT).as_posix()
            key = path.with_suffix("").relative_to(REPO_ROOT).as_posix()
            item = by_base.setdefault(key, {
                "basename": path.stem,
                "folder": path.parent.relative_to(REPO_ROOT).as_posix(),
                "label": _label_from_name(path.stem),
                "jpg_url": "",
                "webp_url": "",
                "url": f"/{rel}",
                "updated_at": datetime.fromtimestamp(path.stat().st_mtime).isoformat(timespec="seconds"),
            })
            suffix = path.suffix.lower()
            if suffix == ".webp":
                item["webp_url"] = f"/{rel}"
                item["url"] = f"/{rel}"
            elif suffix in {".jpg", ".jpeg"}:
                item["jpg_url"] = f"/{rel}"
                if not item.get("url"):
                    item["url"] = f"/{rel}"
            elif suffix == ".png" and not item.get("jpg_url"):
                item["jpg_url"] = f"/{rel}"
    return sorted(by_base.values(), key=lambda row: (row["folder"], row["basename"]))


def read_images_manifest(refresh: bool = False) -> list[dict[str, Any]]:
    ensure_content_files()
    if refresh:
        data = scan_images()
        write_json(IMAGES_MANIFEST, data)
        return data
    data = read_json(IMAGES_MANIFEST, [])
    if not data:
        data = scan_images()
        write_json(IMAGES_MANIFEST, data)
    return data


def upsert_image_manifest(entry: dict[str, Any]) -> list[dict[str, Any]]:
    data = read_images_manifest()
    key = (entry.get("folder"), entry.get("basename"))
    replaced = False
    for idx, item in enumerate(data):
        if (item.get("folder"), item.get("basename")) == key:
            data[idx] = {**item, **entry}
            replaced = True
            break
    if not replaced:
        data.insert(0, entry)
    write_json(IMAGES_MANIFEST, data)
    return data


def publish_site(commit_message: str | None = None, push: bool = False) -> dict[str, Any]:
    build = subprocess.run(
        [sys.executable, "build_pages.py"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if build.returncode != 0:
        return {"ok": False, "stage": "build", "stdout": build.stdout, "stderr": build.stderr}

    status = subprocess.run(
        ["git", "status", "--short"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    result = {
        "ok": True,
        "stage": "local-build",
        "stdout": build.stdout,
        "stderr": build.stderr,
        "git_status": status.stdout.splitlines(),
        "pushed": False,
    }
    if not push and os.getenv("ADMIN_PUBLISH_PUSH", "0") != "1":
        return result

    message = commit_message or f"Update website content {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    subprocess.run(["git", "add", "index.html", "news.json", "content", "assets/images"], cwd=REPO_ROOT, check=True)
    commit = subprocess.run(["git", "commit", "-m", message], cwd=REPO_ROOT, text=True, capture_output=True, check=False)
    if commit.returncode != 0 and "nothing to commit" not in (commit.stdout + commit.stderr).lower():
        return {**result, "ok": False, "stage": "commit", "stdout": commit.stdout, "stderr": commit.stderr}

    # push 前先 pull --rebase 同步,防 G:/ 那边推得多导致 reject(踩坑日 5/9)
    pull_result = subprocess.run(
        ["git", "pull", "--rebase", "origin", "master"],
        cwd=REPO_ROOT, text=True, capture_output=True, check=False,
    )
    if pull_result.returncode != 0:
        return {
            **result, "ok": False, "stage": "git-pull-rebase",
            "pull_stdout": pull_result.stdout,
            "pull_stderr": pull_result.stderr,
            "hint": "服务器仓库 rebase 失败,可能有 conflict。墨需要 ssh 手动解决:cd /opt/hboyjd-website && git rebase --abort 然后重试",
        }

    push_result = subprocess.run(["git", "push", "origin", "master"], cwd=REPO_ROOT, text=True, capture_output=True, check=False)
    # 如果 push 还失败(比如刚 rebase 完又被别人推了),做一次重试
    if push_result.returncode != 0 and "rejected" in (push_result.stderr or "").lower():
        retry_pull = subprocess.run(
            ["git", "pull", "--rebase", "origin", "master"],
            cwd=REPO_ROOT, text=True, capture_output=True, check=False,
        )
        if retry_pull.returncode == 0:
            push_result = subprocess.run(["git", "push", "origin", "master"], cwd=REPO_ROOT, text=True, capture_output=True, check=False)

    result.update({
        "stage": "git-push",
        "pulled": pull_result.returncode == 0,
        "pull_stdout": pull_result.stdout,
        "pull_stderr": pull_result.stderr,
        "pushed": push_result.returncode == 0,
        "push_stdout": push_result.stdout,
        "push_stderr": push_result.stderr,
        "ok": push_result.returncode == 0,
    })
    return result


def _label_from_name(name: str) -> str:
    label = re.sub(r"[-_]+", " ", name).strip()
    return label[:1].upper() + label[1:]
