"""给所有公开页面挂上自有访问统计脚本 /assets/js/hit.js(幂等,可反复跑)。

新增页面或重新生成页面(英文版、车型详情页)之后跑一次:
    python scripts/inject_tracker.py
改了 hit.js 想让浏览器拿新版本:改下面的 VERSION 再跑一次。
"""
import re
import sys
from pathlib import Path

VERSION = "20260928a"
ROOT = Path(__file__).resolve().parent.parent
GLOBS = ["*.html", "en/*.html", "vehicles/*.html", "en/vehicles/*.html"]
# async 而非 defer:defer 要等前面所有样式表加载完,国内打不开的外链样式表会把它拖几十秒
TAG = f'<script src="/assets/js/hit.js?v={VERSION}" async></script>'
EXISTING = re.compile(r'<script src="/assets/js/hit\.js(\?v=[^"]*)?" (?:defer|async)></script>')


def main() -> int:
    changed = 0
    for pattern in GLOBS:
        for path in sorted(ROOT.glob(pattern)):
            html = path.read_text(encoding="utf-8")
            if EXISTING.search(html):
                new = EXISTING.sub(TAG, html, count=1)
            elif "</head>" in html:
                new = html.replace("</head>", f"    {TAG}\n</head>", 1)
            else:
                print(f"skip (no </head>): {path.relative_to(ROOT)}")
                continue
            if new != html:
                path.write_bytes(new.encode("utf-8"))
                changed += 1
    print(f"tracker tag ok, {changed} file(s) updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
