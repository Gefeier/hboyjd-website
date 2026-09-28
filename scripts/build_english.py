"""Render the existing bilingual templates as crawlable English HTML.

The Chinese HTML and its data-en attributes remain the only page templates.
This mirrors the original language switch at build time, retaining all sections,
media, classes, IDs and scripts. No third-party build dependency is required.
"""
from html import escape
from html.parser import HTMLParser
import json
import re
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit

ORIGIN = "https://hboyjd.com"
PAGES = {"index.html": ("/", "/en/"), "about.html": ("/about.html", "/en/about.html")}
VOID = set("area base br col embed hr img input link meta param source track wbr".split())


def bilingual_pages(root):
    pages = dict(PAGES)
    for path in [root / "models.html", *sorted(root.glob("product-*.html")),
                 *sorted((root / "vehicles").glob("*.html"))]:
        if path.is_file():
            name = path.relative_to(root).as_posix()
            pages[name] = ("/" + name, "/en/" + name)
    return pages


def root_url(value, source_url="/"):
    """Resolve template-relative assets against the original site root."""
    if not value or value.startswith(("#", "/")) or urlsplit(value).scheme:
        return value
    return urljoin(source_url, value)


def english_link(value, source_url="/", pages=None):
    absolute = urlsplit(urljoin(ORIGIN + source_url, value))
    if absolute.netloc != "hboyjd.com" or absolute.scheme not in ("https", "http"):
        return value
    routes = {zh: en for zh, en in (pages or PAGES).values()}
    routes["/index.html"] = "/en/"
    path = routes.get(absolute.path, absolute.path)
    return urlunsplit(("", "", path, absolute.query, absolute.fragment))


class EnglishPage(HTMLParser):
    def __init__(self, chinese_url, english_url, translations=None, pages=None):
        super().__init__(convert_charrefs=False)
        self.chinese_url = chinese_url
        self.english_url = english_url
        self.output = []
        self.skip_depth = 0
        self.select_first = None
        self.translations = translations
        self.pages = pages
        self.raw_tag = None

    def translate(self, value):
        if self.translations is None or not re.search(r"[\u4e00-\u9fff]", value):
            return value
        key = re.sub(r"\s+", " ", value).strip()
        if key == "中":
            return value
        if key not in self.translations:
            raise ValueError(f"Missing English translation in {self.chinese_url}: {key}")
        return self.translations[key]

    def handle_starttag(self, tag, attrs):
        self._start(tag, attrs, False)

    def handle_startendtag(self, tag, attrs):
        self._start(tag, attrs, True)

    def _start(self, tag, attrs, closed):
        if self.skip_depth:
            if tag not in VOID and not closed:
                self.skip_depth += 1
            return
        attrs = dict(attrs)
        if tag in ("script", "style"):
            self.raw_tag = tag
        translated = attrs.get("data-en")
        if tag == "html":
            attrs["lang"] = "en"
        if tag == "select":
            self.select_first = attrs.get("data-en-first")
        if tag == "option" and self.select_first is not None:
            translated = self.select_first
            self.select_first = None
        for attr in ("placeholder", "alt", "title", "aria-label", "data-open-label", "data-close-label"):
            if attrs.get("data-en-" + attr):
                attrs[attr] = attrs["data-en-" + attr]
            elif attrs.get(attr):
                attrs[attr] = self.translate(attrs[attr])
        if tag == "meta":
            if translated:
                attrs["content"] = translated
            elif attrs.get("content"):
                attrs["content"] = self.translate(attrs["content"])
            prop = attrs.get("property")
            if prop == "og:url":
                attrs["content"] = ORIGIN + self.english_url
            elif prop == "og:locale":
                attrs["content"] = "en_US"
            elif prop == "og:locale:alternate":
                attrs["content"] = "zh_CN"
        if tag == "link" and attrs.get("rel") == "canonical":
            attrs["href"] = ORIGIN + self.english_url
        elif tag == "a" and "lang-toggle" in attrs.get("class", "").split():
            attrs.update(href=self.chinese_url, hreflang="zh-CN", lang="zh-CN",
                         title="切换中文", **{"aria-label": "切换中文"})
        elif tag == "a" and attrs.get("href") and not attrs["href"].startswith("#"):
            attrs["href"] = english_link(attrs["href"], self.chinese_url, self.pages)
        elif tag == "link" and attrs.get("rel") != "alternate" and "href" in attrs:
            attrs["href"] = root_url(attrs["href"], self.chinese_url)
        for attr in ("src", "poster", "data-src"):
            if attr in attrs:
                attrs[attr] = root_url(attrs[attr], self.chinese_url)
        if "srcset" in attrs:
            attrs["srcset"] = ", ".join(" ".join([root_url(parts[0], self.chinese_url)] + parts[1:])
                for parts in (item.strip().split() for item in attrs["srcset"].split(",")))
        classes = attrs.get("class", "").split()
        if "lang-zh" in classes:
            attrs["class"] = " ".join(c for c in classes if c != "active")
        elif "lang-en" in classes:
            attrs["class"] = " ".join(classes + ([] if "active" in classes else ["active"]))
        self.output.append("<" + tag + "".join(
            " " + key if value is None else ' ' + key + '="' + escape(value, quote=True) + '"'
            for key, value in attrs.items()) + (" />" if closed else ">"))
        if tag == "head":
            self.output.append("\n<!-- Generated by build_pages.py from the shared bilingual template; do not edit this file. -->")
        if translated is not None and tag not in VOID and not closed:
            self.output.append(escape(translated, quote=False))
            self.skip_depth = 1

    def handle_endtag(self, tag):
        if tag == self.raw_tag:
            self.raw_tag = None
        if self.skip_depth:
            self.skip_depth -= 1
            if self.skip_depth:
                return
        if tag == "select":
            self.select_first = None
        self.output.append("</" + tag + ">")

    def handle_data(self, data):
        if not self.skip_depth:
            if not self.raw_tag and self.translations is not None and re.search(r"[\u4e00-\u9fff]", data):
                translated = self.translate(data)
                self.output.append(escape(translated, quote=False))
            else:
                self.output.append(data)

    def handle_entityref(self, name):
        self.handle_data("&" + name + ";")

    def handle_charref(self, name):
        self.handle_data("&#" + name + ";")

    def handle_comment(self, data):
        if not self.skip_depth:
            self.output.append("<!--" + data + "-->")

    def handle_decl(self, decl):
        self.handle_data("<!" + decl + ">")


def build_english(root, only=None):
    root = Path(root)
    (root / "en").mkdir(exist_ok=True)
    pages = bilingual_pages(root)
    catalog = root / "content" / "product-translations.json"
    translations = json.loads(catalog.read_text(encoding="utf-8")) if catalog.exists() else None
    # Keep the full route map when rebuilding selected pages, so nested links
    # still resolve to English while unrelated generated files remain untouched.
    selected = pages if only is None else {name: pages[name] for name in only}
    for name, (chinese_url, english_url) in selected.items():
        product_page = name not in PAGES
        if product_page and translations is None:
            raise ValueError("Missing content/product-translations.json")
        parser = EnglishPage(chinese_url, english_url, translations if product_page else None, pages)
        parser.feed((root / name).read_text(encoding="utf-8"))
        parser.close()
        output = "".join(parser.output)
        if product_page:
            def translate_product_schema(match):
                data = json.loads(match.group(1))
                def visit(value):
                    if isinstance(value, dict):
                        translated = {k: visit(v) for k, v in value.items()}
                        # Localize document links, while keeping organization
                        # identity URLs and @ids shared across languages.
                        if value.get("@type") in ("CollectionPage", "WebPage", "ListItem") and isinstance(value.get("url"), str):
                            route = english_link(value["url"], chinese_url, pages)
                            translated["url"] = urljoin(ORIGIN, route)
                        return translated
                    if isinstance(value, list):
                        return [visit(v) for v in value]
                    return parser.translate(value) if isinstance(value, str) else value
                return '<script type="application/ld+json">' + json.dumps(visit(data), ensure_ascii=False) + '</script>'
            output = re.sub(r'<script type="application/ld\+json">(.*?)</script>',
                            translate_product_schema, output, flags=re.S)
            output = re.sub(r"[ \t]+$", "", output, flags=re.M)
        target = root / "en" / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(output, encoding="utf-8")
        print("built en/" + name + " from shared " + name)


if __name__ == "__main__":
    import sys
    build_english(Path(__file__).resolve().parents[1], only=sys.argv[1:] or None)
