import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from build_english import EnglishPage, bilingual_pages, build_english, english_link
from check_seo import Page


class EnglishBuildTests(unittest.TestCase):
    def test_interactive_links_keep_model_and_paint_with_english_ui(self):
        from urllib.parse import parse_qs, urlsplit
        route = english_link('/vehicle-experience.html?model=JDV9382TDP&paint=jude-red&lang=zh#viewer')
        parsed = urlsplit(route)
        self.assertEqual(parsed.path, '/vehicle-experience.html')
        self.assertEqual(parsed.fragment, 'viewer')
        self.assertEqual(parse_qs(parsed.query), {'model': ['JDV9382TDP'], 'paint': ['jude-red'], 'lang': ['en']})
        self.assertEqual(english_link('/vehicle-experience.html'), '/vehicle-experience.html?lang=en')

    def test_selected_build_localizes_schema_routes_without_changing_company_identity(self):
        import re
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            (target / "content").mkdir()
            (target / "vehicles").mkdir()
            (target / "en").mkdir()
            (target / "content/product-translations.json").write_text("{}")
            (target / "vehicles/A.html").write_text("<h1>A</h1>")
            (target / "product-other.html").write_text("<h1>Other</h1>")
            untouched = target / "en/product-other.html"
            untouched.write_text("Keep this generated page untouched")
            schema = {"@type": "CollectionPage", "url": "https://hboyjd.com/product-test.html",
                      "publisher": {"@type": "Organization", "@id": "https://hboyjd.com/#organization",
                                    "url": "https://hboyjd.com/"},
                      "mainEntity": {"@type": "ItemList", "itemListElement": [
                          {"@type": "ListItem", "url": "https://hboyjd.com/vehicles/A.html"}]}}
            (target / "product-test.html").write_text(
                '<script type="application/ld+json">' + json.dumps(schema) + '</script>'
                '<a href="/vehicles/A.html">A</a>')
            build_english(target, only=["product-test.html"])
            output = (target / "en/product-test.html").read_text()
            translated = json.loads(re.search(r'<script[^>]*>(.*?)</script>', output).group(1))
            self.assertEqual(translated["url"], "https://hboyjd.com/en/product-test.html")
            self.assertEqual(translated["publisher"], schema["publisher"])
            self.assertEqual(translated["mainEntity"]["itemListElement"][0]["url"],
                             "https://hboyjd.com/en/vehicles/A.html")
            self.assertIn('href="/en/vehicles/A.html"', output)
            self.assertEqual(untouched.read_text(), "Keep this generated page untouched")

    def test_nested_vehicle_links_keep_language_and_model_query(self):
        pages = {"models.html": ("/models.html", "/en/models.html"),
                 "vehicles/A.html": ("/vehicles/A.html", "/en/vehicles/A.html"),
                 "vehicles/B.html": ("/vehicles/B.html", "/en/vehicles/B.html")}
        page = EnglishPage("/vehicles/A.html", "/en/vehicles/A.html", {"参数": "Specifications"}, pages)
        page.feed('<h2>参数</h2><a href="B.html#spec">Next</a>'
                  '<a href="../models.html">Models</a><img src="../assets/test.webp">'
                  '<a href="../configurator.html?model=A&amp;vname=test">Quote</a>'
                  '<a class="lang-toggle" href="/en/vehicles/A.html"><span>中</span></a>')
        output = "".join(page.output)
        self.assertIn('<h2>Specifications</h2>', output)
        self.assertIn('href="/en/vehicles/B.html#spec"', output)
        self.assertIn('href="/en/models.html"', output)
        self.assertIn('src="/assets/test.webp"', output)
        self.assertIn('href="/configurator.html?model=A&amp;vname=test"', output)
        self.assertIn('href="/vehicles/A.html"', output)

    def test_unknown_product_copy_fails_instead_of_publishing_mixed_languages(self):
        page = EnglishPage("/vehicles/A.html", "/en/vehicles/A.html", {})
        with self.assertRaisesRegex(ValueError, "Missing English translation"):
            page.feed('<h1>未翻译的新车型</h1>')

    def test_product_layout_and_numeric_specifications_are_preserved(self):
        import re
        from html import unescape
        for name in bilingual_pages(ROOT):
            if name in ("index.html", "about.html"):
                continue
            chinese = Page(ROOT / name)
            english = Page(ROOT / "en" / name)
            for tag in ("section", "img", "source", "form"):
                self.assertEqual(sum(t == tag for t, _ in chinese.tags),
                                 sum(t == tag for t, _ in english.tags), (name, tag))
            def spec_numbers(path):
                values = re.findall(r'<span class="pf-spec-val">(.*?)</span>', path.read_text(), re.S)
                return [re.findall(r'\d+(?:\.\d+)?', unescape(re.sub('<[^>]+>', '', v))) for v in values]
            self.assertEqual(spec_numbers(ROOT / name), spec_numbers(ROOT / "en" / name), name)

    def test_translation_escapes_text_and_keeps_sibling_media(self):
        page = EnglishPage("/", "/en/")
        page.feed('<section><p data-en="R&amp;D &lt;team&gt;">中文<strong>旧内容</strong></p>'
                  '<img src="assets/test.jpg"><a href="about.html#team">About</a>'
                  '<script>const text = "<keep>";</script></section>')
        output = "".join(page.output)
        self.assertIn('R&amp;D &lt;team&gt;</p><img src="/assets/test.jpg">', output)
        self.assertNotIn('旧内容', output)
        self.assertIn('href="/en/about.html#team"', output)
        self.assertIn('<script>const text = "<keep>";</script>', output)

    def test_cms_edit_updates_both_languages_without_layout_loss(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            (target / "content").mkdir()
            (target / "scripts").mkdir()
            for name in ["build_pages.py", "scripts/build_english.py", "index.html",
                         "about.html", "news.html", "content/index.json"]:
                shutil.copy2(ROOT / name, target / name)
            path = target / "content/index.json"
            data = json.loads(path.read_text())
            data["hero"]["title"] = "测试页面标题"
            data["hero"]["title_en"] = "Updated R&D <title>"
            data["about"]["para1_en"] = "Updated English company introduction."
            data["about_page"]["ab-hero-title_en"] = "Updated Company Story"
            path.write_text(json.dumps(data))
            subprocess.run([sys.executable, "build_pages.py"], cwd=target,
                           stdout=subprocess.PIPE, check=True)
            for name in ["index.html", "about.html"]:
                chinese = Page(target / name)
                english = Page(target / "en" / name)
                for tag in ["section", "form", "video", "img", "source"]:
                    self.assertEqual(sum(t == tag for t, _ in chinese.tags),
                                     sum(t == tag for t, _ in english.tags), (name, tag))
                self.assertEqual([a.get("class") for t, a in chinese.tags if t == "section"],
                                 [a.get("class") for t, a in english.tags if t == "section"])
                styles = [a["href"].lstrip("/") for a in english.links("stylesheet")]
                self.assertEqual(styles, [a["href"] for a in chinese.links("stylesheet")])
            self.assertIn("测试页面标题", (target / "index.html").read_text())
            self.assertIn("Updated R&amp;D &lt;title&gt;", (target / "en/index.html").read_text())
            self.assertIn("Updated English company introduction.", (target / "en/index.html").read_text())
            self.assertIn("Updated Company Story", (target / "en/about.html").read_text())
            before = [(target / "en" / name).read_bytes() for name in ["index.html", "about.html"]]
            subprocess.run([sys.executable, "build_pages.py"], cwd=target,
                           stdout=subprocess.PIPE, check=True)
            self.assertEqual(before, [(target / "en" / name).read_bytes() for name in ["index.html", "about.html"]])

    def test_publisher_stages_generated_pages_with_content(self):
        spec = importlib.util.spec_from_file_location("content_io", ROOT / "admin/backend/content_io.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        real_run = subprocess.run
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            for name in ["index.html", "about.html", "news.html", "news.json",
                         "en/index.html", "en/about.html", "content/index.json", "assets/images/test.txt"]:
                file = target / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text("updated content")
            real_run(["git", "init", "-q"], cwd=target, check=True)
            staged = []

            def run(command, **kwargs):
                if command[:2] in (["git", "add"], ["git", "status"]):
                    return real_run(command, **kwargs)
                if command[:2] == ["git", "commit"]:
                    staged.extend(real_run(["git", "diff", "--cached", "--name-only"],
                                           cwd=target, text=True, stdout=subprocess.PIPE,
                                           check=True).stdout.splitlines())
                return subprocess.CompletedProcess(command, 0, "", "")

            with patch.object(module, "REPO_ROOT", target), patch.object(module.subprocess, "run", run):
                result = module.publish_site("test bilingual publish", push=True)
            self.assertTrue(result["ok"])
            self.assertTrue({"index.html", "about.html", "en/index.html", "en/about.html",
                             "content/index.json"}.issubset(staged))


if __name__ == "__main__":
    unittest.main()
