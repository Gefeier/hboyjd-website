from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, jsonify, redirect, request, send_from_directory

import auth
import users_io
from audit_log import append_log, read_logs
from content_io import REPO_ROOT, append_news, ensure_content_files, publish_site, read_images_manifest, read_section, write_section
from image_processor import process_upload
from wechat_fetcher import fetch_wechat_article
from translate import translate_batch as do_translate_batch


app = Flask(__name__, static_folder=None)
app.secret_key = os.getenv("ADMIN_SECRET_KEY", "local-demo-change-me")
ensure_content_files()


@app.errorhandler(PermissionError)
def handle_permission(_: PermissionError):
    return jsonify({"error": "unauthorized"}), 401


@app.errorhandler(ValueError)
def handle_value_error(exc: ValueError):
    return jsonify({"error": str(exc)}), 400


@app.route("/")
def root():
    return redirect("/admin/dashboard.html")


@app.route("/admin/")
def admin_root():
    return redirect("/admin/dashboard.html")


@app.route("/admin/<path:filename>")
def admin_static(filename: str):
    return send_from_directory(REPO_ROOT / "admin", filename)


@app.route("/assets/<path:filename>")
def assets_static(filename: str):
    return send_from_directory(REPO_ROOT / "assets", filename)


# 服 REPO_ROOT 根目录静态资源(style.css / main.js / news.json / about.css 等)
# admin preview iframe 加载真实 about.html 时浏览器会去 /style.css 拿,这条 catch-all 兜底
# 注意:Flask 路由 specificity 让 /admin/* /api/* /assets/* 等先匹,这里只兜根目录文件
_REPO_ROOT_FILES = {"style.css", "about.css", "main.js", "news.json", "sitemap.xml", "robots.txt", "favicon.ico", "favicon-512x512.png", "index.html", "about.html", "configurator.html", "parts.html", "parts-data.json"}

@app.route("/<filename>")
def serve_repo_root_file(filename: str):
    # 白名单:防泄露 .git / SPRINT.md / requirements.txt 等内部文件
    if filename not in _REPO_ROOT_FILES:
        return f"未授权: {filename}", 404
    target = REPO_ROOT / filename
    if not target.exists() or not target.is_file():
        return f"not found: {filename}", 404
    return send_from_directory(str(REPO_ROOT), filename)


@app.route("/api/auth/me")
def auth_me():
    user = auth.current_user()
    if not user:
        raise PermissionError("unauthorized")
    return jsonify(user)


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    user = auth.login_with_password(username, password)
    append_log(user, "login", "auth", "登录后台(密码)")
    return jsonify(user)


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    user = auth.current_user()
    auth.logout()
    if user:
        append_log(user, "logout", "auth", "登出")
    return jsonify({"ok": True})


@app.route("/api/auth/change-password", methods=["POST"])
def auth_change_password():
    user = auth.require_user()
    payload = request.get_json(silent=True) or {}
    old_password = payload.get("old_password") or ""
    new_password = payload.get("new_password") or ""
    auth.change_password(user["userid"], old_password, new_password)
    append_log(user, "change-password", "auth", "改自己密码")
    return jsonify({"ok": True})


@app.route("/api/users", methods=["GET"])
def users_list():
    auth.require_admin()
    return jsonify(users_io.list_users())


@app.route("/api/users", methods=["POST"])
def users_create():
    admin = auth.require_admin()
    payload = request.get_json(force=True) or {}
    new_user = users_io.create(
        userid=payload.get("userid", ""),
        name=payload.get("name", ""),
        role=payload.get("role", "editor"),
        password=payload.get("password", ""),
    )
    append_log(admin, "create-user", new_user["userid"], f"新建账号({new_user['role']}) {new_user['name']}")
    return jsonify(new_user), 201


@app.route("/api/users/<userid>", methods=["PATCH"])
def users_update(userid: str):
    actor = auth.require_user()
    payload = request.get_json(force=True) or {}
    is_admin = actor.get("role") == "admin"
    is_self = actor.get("userid") == userid

    # admin 可以改任何人的任何字段(除了把自己 disabled 或 demote 自己 admin)
    # 非 admin 只能改自己的密码
    if not is_admin:
        if not is_self:
            raise PermissionError("仅 admin 可改其他账号")
        if any(k in payload for k in ("role", "disabled", "name")):
            raise PermissionError("非 admin 只能改自己密码")

    if is_admin and is_self:
        if payload.get("disabled") is True:
            raise ValueError("不能停用自己")
        if "role" in payload and payload["role"] != "admin":
            raise ValueError("不能把自己降级")

    updated = users_io.update(
        userid,
        **{k: v for k, v in payload.items() if k in ("name", "role", "password", "disabled")},
    )
    summary_parts = []
    if "password" in payload: summary_parts.append("改密码")
    if "role" in payload: summary_parts.append(f"角色→{payload['role']}")
    if "disabled" in payload: summary_parts.append("停用" if payload["disabled"] else "启用")
    if "name" in payload: summary_parts.append(f"姓名→{payload['name']}")
    append_log(actor, "update-user", userid, ", ".join(summary_parts) or "更新")
    return jsonify(updated)


@app.route("/api/auth/dingtalk-qrcode")
def auth_qrcode():
    return jsonify(auth.qrcode_payload())


@app.route("/api/auth/dingtalk-callback", methods=["GET", "POST"])
def auth_callback():
    payload = {}
    if request.is_json:
        payload.update(request.get_json(silent=True) or {})
    payload.update(request.form.to_dict())
    payload.update(request.args.to_dict())
    user = auth.login_from_callback(payload)
    append_log(user, "login", "auth", "登录后台")
    if request.method == "GET":
        return redirect("/admin/dashboard.html")
    return jsonify(user)


@app.route("/api/content/<section>", methods=["GET", "PATCH"])
def content_section(section: str):
    user = auth.require_user()
    if request.method == "GET":
        return jsonify(read_section(section))
    data = request.get_json(force=True)
    write_section(section, data)
    append_log(user, "save", f"content/{section}", "暂存内容修改")
    return jsonify({"ok": True})


@app.route("/api/images")
def images():
    auth.require_user()
    refresh = request.args.get("refresh") == "1"
    return jsonify(read_images_manifest(refresh=refresh))


@app.route("/api/upload/image", methods=["POST"])
def upload_image():
    user = auth.require_user()
    file = request.files.get("image")
    if not file:
        raise ValueError("缺少 image 文件")
    entry = process_upload(
        file,
        folder=request.form.get("folder", "about"),
        basename=request.form.get("basename") or None,
        label=request.form.get("label", ""),
    )
    append_log(user, "upload-image", entry["url"], f"{entry['width']}x{entry['height']} webp/jpg")
    return jsonify(entry)


@app.route("/api/news/from-wechat-url", methods=["POST"])
def news_from_wechat_url():
    user = auth.require_user()
    payload = request.get_json(force=True)
    article = fetch_wechat_article(payload.get("url", ""))
    saved, inserted = append_news(article)
    append_log(user, "wechat-news", saved["url"], "新增公众号新闻" if inserted else "更新已有公众号新闻")
    return jsonify(saved)


@app.route("/admin/preview/<path:page>")
def admin_preview(page):
    """加载 /opt/hboyjd-website/<page> 真实 HTML,注入桥接 JS 让父页 admin 能 postMessage 推改动"""
    auth.require_user()
    WHITELIST = {"index.html", "about.html", "news.html"}
    if page not in WHITELIST:
        return f"页面 {page} 不在预览白名单", 404
    html_path = REPO_ROOT / page
    if not html_path.exists():
        return f"页面文件不存在: {page}", 404
    html = html_path.read_text(encoding="utf-8")

    # 注入预览桥接(放 </body> 前)
    bridge = """
<script>
(function(){
  // 顶部加预览模式 banner
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:linear-gradient(90deg,#0a1628,#1a3a5c);color:#d4a853;padding:7px 14px;font-size:12px;font-family:system-ui,-apple-system,sans-serif;letter-spacing:2px;text-align:center;border-bottom:1px solid rgba(212,168,83,0.3);';
  banner.textContent = '🔧 admin 预览模式 · 左侧改字段右边实时反映 · 改完点「保存暂存」+「发布预演」才上线';
  document.body.insertBefore(banner, document.body.firstChild);
  document.body.style.paddingTop = '34px';

  // 字段 → 选择器映射(扩字段在这里加)
  const MAP = {
    'hero-title': '.hero-title',
    'hero-subtitle': '.hero-subtitle',
    'hero-desc': '.hero-desc',
    // about 区(走 data-cms-key 通用机制)
    'about-title': '[data-cms-key="about-title"]',
    'about-subtitle': '[data-cms-key="about-subtitle"]',
    'about-para1': '[data-cms-key="about-para1"]',
    'about-para2': '[data-cms-key="about-para2"]',
    // news.html 子页 hero
    'news-hero-title': '[data-cms-key="news-hero-title"]',
    'news-hero-tagline': '[data-cms-key="news-hero-tagline"]',
  };
  // _en 后缀字段 → 改 data-en 属性(主站切英文 toggle 读这个)
  const EN_MAP = {
    'hero-title-en': '.hero-title',
    'hero-subtitle-en': '.hero-subtitle',
    'hero-desc-en': '.hero-desc',
    'about-title-en': '[data-cms-key="about-title"]',
    'about-subtitle-en': '[data-cms-key="about-subtitle"]',
    'about-para1-en': '[data-cms-key="about-para1"]',
    'about-para2-en': '[data-cms-key="about-para2"]',
    'news-hero-title-en': '[data-cms-key="news-hero-title"]',
    'news-hero-tagline-en': '[data-cms-key="news-hero-tagline"]',
  };

  window.addEventListener('message', function(ev){
    if (!ev.data || ev.data.type !== 'cms-update') return;
    const k = ev.data.key, v = ev.data.value;
    // 中文字段直接改 textContent
    if (MAP[k]) {
      document.querySelectorAll(MAP[k]).forEach(function(el){ el.textContent = v; });
      return;
    }
    // _en 后缀的改 data-en 属性(主站有切换中英按钮会读这个)
    if (EN_MAP[k]) {
      document.querySelectorAll(EN_MAP[k]).forEach(function(el){ el.setAttribute('data-en', v); });
      return;
    }
  });

  // 图槽位 src 匹配(双向跟踪:点图跳左 form 槽)
  const ABOUT_IMG_SLOTS = {
    // about.html 关于页 6 张
    'about-gate': 'about-gate.',
    'staff-rally': 'staff-rally.',
    'team-rally': 'team-rally.',
    'factory-cutting-line': 'factory-cutting-line.',
    'party-volunteer': 'party-volunteer.',
    'team-trip-2020': 'team-trip-2020.',
    // 首页 about-carousel 3 张轮播
    'team-trucks': 'team-trucks.',
    'lab-testing': 'lab-testing.',
    'team-assembly': 'team-assembly.',
    // 首页 honors 8 张资质
    'honor-srdi-little-giant-2022': 'honor-srdi-little-giant-2022.',
    'honor-smart-mfg-2024': 'honor-smart-mfg-2024.',
    'honor-hubut-research-2021': 'honor-hubut-research-2021.',
    'honor-tax-2022': 'honor-tax-2022.',
    'honor-logistics-star-2021': 'honor-logistics-star-2021.',
    'honor-logistics-chain-2019': 'honor-logistics-chain-2019.',
    'honor-truckhome-2021': 'honor-truckhome-2021.',
    'honor-shaanxi-breakthrough-2018': 'honor-shaanxi-breakthrough-2018.',
  };

  // 点击区块通知 parent 跳到对应字段
  document.addEventListener('click', function(ev){
    let el = ev.target;
    while (el && el !== document.body) {
      // 0) 通用 data-cms-key 元素(about-title/about-subtitle/about-para1/2 等)
      if (el.dataset && el.dataset.cmsKey) {
        if (window.parent !== window) {
          window.parent.postMessage({type: 'cms-focus', key: el.dataset.cmsKey}, '*');
        }
        ev.preventDefault();
        return;
      }
      // 1) hero 三字段(走 class) → 跳 form input
      if (el.classList && (el.classList.contains('hero-title') || el.classList.contains('hero-subtitle') || el.classList.contains('hero-desc'))) {
        const key = el.classList.contains('hero-title') ? 'hero-title'
                   : el.classList.contains('hero-subtitle') ? 'hero-subtitle' : 'hero-desc';
        if (window.parent !== window) {
          window.parent.postMessage({type: 'cms-focus', key: key}, '*');
        }
        ev.preventDefault();
        return;
      }
      // 2) 图片(<img> 或 <picture>)→ 按 src 路径推断 about 关键图 slot,跳左 form 槽
      if (el.tagName === 'IMG' || el.tagName === 'PICTURE') {
        const img = el.tagName === 'IMG' ? el : el.querySelector('img');
        const src = (img && img.src) || (img && img.getAttribute('data-src')) || '';
        for (const slotKey in ABOUT_IMG_SLOTS) {
          if (src.indexOf(ABOUT_IMG_SLOTS[slotKey]) !== -1) {
            if (window.parent !== window) {
              window.parent.postMessage({type: 'cms-focus', key: 'slot:' + slotKey}, '*');
            }
            ev.preventDefault();
            return;
          }
        }
        // 其他图也别跳走(预览模式所有 a 链接 / lightbox 都吞)
      }
      // 3) <a> 链接吞掉(预览模式不跳走)
      if (el.tagName === 'A' && el.href && el.href.indexOf('#') === -1) {
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }
      el = el.parentElement;
    }
  }, true);

  // 通知 parent: preview 已就绪可推初始值
  if (window.parent !== window) {
    window.parent.postMessage({type: 'cms-preview-ready'}, '*');
  }
})();
</script>
"""
    if "</body>" in html:
        html = html.replace("</body>", bridge + "</body>")
    else:
        html += bridge

    # 注入 <base href="/"> 到 <head> 顶部,让所有相对 URL(style.css/main.js/assets/...) 解析为根路径
    # 不然 iframe 的 base URL 是 /admin/preview/,style.css 会被解成 /admin/preview/style.css 404
    if "<head>" in html:
        html = html.replace("<head>", '<head><base href="/">', 1)
    elif "<HEAD>" in html:
        html = html.replace("<HEAD>", '<HEAD><base href="/">', 1)

    from flask import Response
    return Response(html, mimetype="text/html; charset=utf-8")


@app.route("/api/replace-about-image", methods=["POST"])
def replace_about_image():
    user = auth.require_user()
    key = (request.form.get("key") or "").strip()
    file = request.files.get("file")
    SLOTS = {
        # about.html 关于我们页(folder=about)
        "about-gate": ("about", "about-gate", "厂区大门"),
        "staff-rally": ("about", "staff-rally", "员工晨会"),
        "team-rally": ("about", "team-rally", "年终团队合影"),
        "factory-cutting-line": ("about", "factory-cutting-line", "工厂车间"),
        "party-volunteer": ("about", "party-volunteer", "党员志愿者"),
        "team-trip-2020": ("about", "team-trip-2020", "员工旅行"),
        # 首页 about-carousel 3 张轮播(folder=images)
        "team-trucks": ("", "team-trucks", "首页轮播·团队卡车"),
        "lab-testing": ("", "lab-testing", "首页轮播·品质检测实验室"),
        "team-assembly": ("", "team-assembly", "首页轮播·团队集合"),
        # 首页 honors-grid 8 张资质(folder=about,沿用 honor-* 命名)
        "honor-srdi-little-giant-2022": ("about", "honor-srdi-little-giant-2022", "湖北省专精特新小巨人 2022"),
        "honor-smart-mfg-2024": ("about", "honor-smart-mfg-2024", "省级智能制造试点 2024"),
        "honor-hubut-research-2021": ("about", "honor-hubut-research-2021", "湖北工大产学研基地"),
        "honor-tax-2022": ("about", "honor-tax-2022", "纳税突出贡献 2023"),
        "honor-logistics-star-2021": ("about", "honor-logistics-star-2021", "物流星级诚信 2021"),
        "honor-logistics-chain-2019": ("about", "honor-logistics-chain-2019", "物流产业链先进 2019"),
        "honor-truckhome-2021": ("about", "honor-truckhome-2021", "卡车之家数字营销 2021"),
        "honor-shaanxi-breakthrough-2018": ("about", "honor-shaanxi-breakthrough-2018", "陕汽湖北区域突破 2018"),
    }
    if key not in SLOTS:
        raise ValueError(f"无效 key: {key}(可选: {','.join(SLOTS.keys())})")
    if not file:
        raise ValueError("缺少 file")
    folder, basename, label = SLOTS[key]
    entry = process_upload(file, folder=folder, basename=basename, label=label)
    append_log(user, "replace-about-image", key, f"换 about/{basename}.jpg+webp")
    return jsonify({"ok": True, "key": key, "label": label, "entry": entry})


@app.route("/api/translate-batch", methods=["POST"])
def translate_batch():
    user = auth.require_user()
    payload = request.get_json(force=True) or {}
    items = payload.get("items") or []
    if not items:
        return jsonify({"translations": {}})
    try:
        translations = do_translate_batch(items)
        append_log(user, "translate-en", "hero", f"翻译 {len(items)} 条")
        return jsonify({"translations": translations})
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503


@app.route("/api/news/batch-import", methods=["POST"])
def news_batch_import():
    user = auth.require_user()
    payload = request.get_json(force=True) or {}
    urls_raw = payload.get("urls") or []
    default_category = (payload.get("default_category") or "company").strip()
    default_label_map = {
        "company": ("公司动态", "Company News"),
        "gov": ("党政动态", "Government & Party"),
        "case": ("客户案例", "Customer Stories"),
    }
    if isinstance(urls_raw, str):
        urls_raw = [u for u in urls_raw.replace("\r", "\n").split("\n") if u.strip()]
    if not isinstance(urls_raw, list):
        raise ValueError("urls 必须是数组或换行字符串")

    results = []
    seen = set()
    for url in urls_raw:
        url = (url or "").strip()
        if not url or url in seen:
            continue
        seen.add(url)
        try:
            article = fetch_wechat_article(url)
            if default_category and not article.get("category"):
                article["category"] = default_category
                label, label_en = default_label_map.get(default_category, default_label_map["company"])
                article["category_label"] = article.get("category_label") or label
                article["category_label_en"] = article.get("category_label_en") or label_en
            saved, inserted = append_news(article)
            results.append({
                "url": url,
                "ok": True,
                "title": saved.get("title"),
                "date": saved.get("date"),
                "inserted": inserted,
            })
        except Exception as exc:
            results.append({"url": url, "ok": False, "error": str(exc)})

    success = sum(1 for r in results if r["ok"])
    inserted_count = sum(1 for r in results if r.get("ok") and r.get("inserted"))
    append_log(user, "batch-import-news", "news",
               f"批量导入 {len(results)} 条,成功 {success},新增 {inserted_count}")
    return jsonify({"total": len(results), "success": success, "inserted": inserted_count, "results": results})


@app.route("/api/publish", methods=["POST"])
def publish():
    user = auth.require_user()
    payload = request.get_json(silent=True) or {}
    result = publish_site(
        commit_message=payload.get("message"),
        push=bool(payload.get("push")),
    )
    append_log(user, "publish", "site", result.get("stage", "unknown"))
    return jsonify(result), 200 if result.get("ok") else 500


@app.route("/api/logs")
def logs():
    auth.require_user()
    limit = min(int(request.args.get("limit", "50")), 200)
    return jsonify(read_logs(limit))


if __name__ == "__main__":
    port = int(os.getenv("ADMIN_PORT", "9005"))
    app.run(host="127.0.0.1", port=port, debug=os.getenv("ADMIN_DEBUG", "0") == "1")
