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
from build_english import EnglishPage
from check_seo import Page


class EnglishBuildTests(unittest.TestCase):
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
