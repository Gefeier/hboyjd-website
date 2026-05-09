from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Any

from PIL import Image, UnidentifiedImageError

from content_io import REPO_ROOT, upsert_image_manifest


ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


def process_upload(file_storage: Any, folder: str = "about", basename: str | None = None, label: str = "") -> dict[str, Any]:
    original_name = Path(file_storage.filename or "upload").name
    suffix = Path(original_name).suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise ValueError("只支持 jpg/png/webp 图片")

    safe_base = _safe_basename(basename or Path(original_name).stem)
    # folder="" 时直接放 assets/images/ 根目录(首页轮播 team-trucks/lab-testing 等)
    if folder:
        target_dir = REPO_ROOT / "assets" / "images" / folder
    else:
        target_dir = REPO_ROOT / "assets" / "images"
    target_dir.mkdir(parents=True, exist_ok=True)
    jpg_path = target_dir / f"{safe_base}.jpg"
    webp_path = target_dir / f"{safe_base}.webp"

    try:
        image = Image.open(file_storage.stream)
        image.load()
    except UnidentifiedImageError as exc:
        raise ValueError("图片文件无法识别") from exc

    image = _normalize_image(image)
    image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
    image.save(jpg_path, "JPEG", quality=85, optimize=True)
    image.save(webp_path, "WEBP", quality=80, method=6)

    folder_segment = f"{folder}/" if folder else ""
    entry = {
        "basename": safe_base,
        "folder": f"assets/images/{folder}".rstrip("/"),
        "label": label or safe_base,
        "jpg_url": f"/assets/images/{folder_segment}{safe_base}.jpg",
        "webp_url": f"/assets/images/{folder_segment}{safe_base}.webp",
        "url": f"/assets/images/{folder_segment}{safe_base}.webp",
        "updated_at": datetime.now().isoformat(timespec="seconds"),
        "max_side": max(image.size),
        "width": image.size[0],
        "height": image.size[1],
    }
    upsert_image_manifest(entry)
    return entry


def _normalize_image(image: Image.Image) -> Image.Image:
    if image.mode in {"RGBA", "LA"}:
        background = Image.new("RGB", image.size, (255, 255, 255))
        alpha = image.getchannel("A") if "A" in image.getbands() else None
        background.paste(image, mask=alpha)
        return background
    if image.mode != "RGB":
        return image.convert("RGB")
    return image


def _safe_basename(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9\u4e00-\u9fff_-]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-_")
    if not value:
        value = f"upload-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    return value[:80]
