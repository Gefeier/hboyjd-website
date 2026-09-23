"""Validate crawlable pages, canonical URLs and reciprocal language links.

Run from any directory: python3 scripts/check_seo.py
Uses the standard library; does not request indexing or contact external services.
"""
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://hboyjd.com"


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.tags = []
        self.visible_text = []
        self.in_script = False
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))
        if tag in ("script", "style"):
            self.in_script = True

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.in_script = False

    def handle_data(self, text):
        if not self.in_script:
            self.visible_text.append(text)

    def links(self, rel):
        return [a for tag, a in self.tags if tag == "link" and a.get("rel") == rel]


def local_file(url):
    path = unquote(urlsplit(url).path).lstrip("/")
    return ROOT / (path + "index.html" if not path or path.endswith("/") else path)


def main():
    urls = [node.text for node in ElementTree.parse(ROOT / "sitemap.xml").findall(
        ".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    assert len(urls) == len(set(urls)), "Duplicate sitemap URL"
    for url in urls:
        assert local_file(url).is_file(), "Missing sitemap target: " + url
        page = Page(local_file(url))
        assert [a["href"] for a in page.links("canonical")] == [url], "Incorrect canonical: " + url
        for tag, attrs in page.tags:
            if tag == "meta" and attrs.get("name", "").lower() in ("robots", "googlebot"):
                assert "noindex" not in attrs.get("content", "").lower(), "Blocked indexing: " + url

    for zh, en in [("/", "/en/"), ("/about.html", "/en/about.html")]:
        expected = {"zh-CN": ORIGIN + zh, "en": ORIGIN + en, "x-default": ORIGIN + zh}
        for path, lang, other in [(zh, "zh-CN", en), (en, "en", zh)]:
            page = Page(local_file(ORIGIN + path))
            assert dict((a["hreflang"], a["href"]) for a in page.links("alternate")) == expected
            assert next(a["lang"] for t, a in page.tags if t == "html") == lang
            assert any(t == "a" and a.get("href") == other for t, a in page.tags), "Missing visible language link"
            assert "Hubei Ouyang Jude Automobile Co., Ltd." in " ".join(page.visible_text)

    for path in ("/en/", "/en/about.html"):
        url = ORIGIN + path
        page = Page(local_file(url))
        for tag, attrs in page.tags:
            for attr in (("href",) if tag in ("a", "link") else ("src",) if tag in ("img", "script") else ()):
                target = urljoin(url, attrs.get(attr, ""))
                if urlsplit(target).netloc != "hboyjd.com":
                    continue
                assert local_file(target).is_file(), "Broken local link: " + target
                fragment = urlsplit(target).fragment
                if fragment:
                    target_page = Page(local_file(target))
                    assert any(a.get("id") == fragment for _, a in target_page.tags), "Broken anchor: " + target
        # JSON-LD must parse independently of JavaScript execution.
        import re
        for data in re.findall(r'<script type="application/ld\+json">(.*?)</script>', local_file(url).read_text(), re.S):
            assert json.loads(data)["@id"] == ORIGIN + "/#organization"
    print("PASS: %s sitemap targets/canonicals; bilingual links; static company name; English links/assets/JSON-LD" % len(urls))


if __name__ == "__main__":
    main()
