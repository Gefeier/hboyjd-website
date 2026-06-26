"""极简 markdown 渲染 — 后端兜底用,不引外部依赖。
支持: ## 标题 / ### 标题 / **粗体** / *斜体* / [text](url) / - 列表 / 1. 列表 / > 引用 / 空行段落

前端用 marked.js 渲染预览,后端发布时用这份重新渲染落盘(确保两侧产物一致风格)。
不追求 100% commonmark 兼容,够用就行。
"""
from __future__ import annotations
import re
import html


def _esc(s: str) -> str:
    return html.escape(s, quote=True)


_INLINE_PATTERNS = [
    # link [text](url)
    (re.compile(r'\[([^\]]+)\]\(([^)]+)\)'),
     lambda m: f'<a href="{_esc(m.group(2))}" target="_blank" rel="noopener">{_esc(m.group(1))}</a>'),
    # bold **x**
    (re.compile(r'\*\*([^*]+)\*\*'),
     lambda m: f'<strong>{_esc(m.group(1))}</strong>'),
    # italic *x* (避免误判:不在 ** 内)
    (re.compile(r'(?<!\*)\*([^*]+)\*(?!\*)'),
     lambda m: f'<em>{_esc(m.group(1))}</em>'),
    # inline code `x`
    (re.compile(r'`([^`]+)`'),
     lambda m: f'<code>{_esc(m.group(1))}</code>'),
]


def _inline(text: str) -> str:
    # 先转义 HTML,再用 inline pattern 替换(对替换结果不再转义)
    escaped = _esc(text)
    # 由于 _esc 把 [ ] ( ) * 等保留了字面量,正则还能匹配
    out = escaped
    for pat, repl in _INLINE_PATTERNS:
        out = pat.sub(repl, out)
    return out


def render(md: str) -> str:
    """把 markdown 文本渲染成 HTML 字符串。"""
    if not md:
        return ""
    md = md.replace("\r\n", "\n").replace("\r", "\n")
    lines = md.split("\n")

    out: list[str] = []
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i].rstrip()

        # 空行
        if not line.strip():
            i += 1
            continue

        # ## 标题
        m = re.match(r'^(#{1,6})\s+(.*)$', line)
        if m:
            level = len(m.group(1))
            out.append(f"<h{level}>{_inline(m.group(2))}</h{level}>")
            i += 1
            continue

        # 引用
        if line.lstrip().startswith(">"):
            buf = []
            while i < n and lines[i].lstrip().startswith(">"):
                buf.append(re.sub(r'^>\s?', '', lines[i].lstrip()))
                i += 1
            out.append("<blockquote>" + " ".join(_inline(l) for l in buf if l) + "</blockquote>")
            continue

        # 无序列表 - x 或 * x
        if re.match(r'^\s*[-*]\s+', line):
            items = []
            while i < n and re.match(r'^\s*[-*]\s+', lines[i].rstrip()):
                items.append(re.sub(r'^\s*[-*]\s+', '', lines[i].rstrip()))
                i += 1
            out.append("<ul>" + "".join(f"<li>{_inline(it)}</li>" for it in items) + "</ul>")
            continue

        # 有序列表 1. x
        if re.match(r'^\s*\d+\.\s+', line):
            items = []
            while i < n and re.match(r'^\s*\d+\.\s+', lines[i].rstrip()):
                items.append(re.sub(r'^\s*\d+\.\s+', '', lines[i].rstrip()))
                i += 1
            out.append("<ol>" + "".join(f"<li>{_inline(it)}</li>" for it in items) + "</ol>")
            continue

        # 普通段落:吃连续非空行
        para = []
        while i < n and lines[i].strip() and not re.match(r'^(#{1,6}\s|>\s?|\s*[-*]\s+|\s*\d+\.\s+)', lines[i]):
            para.append(lines[i].rstrip())
            i += 1
        if para:
            text = "<br>".join(_inline(l) for l in para)
            out.append(f"<p>{text}</p>")

    return "\n".join(out)
