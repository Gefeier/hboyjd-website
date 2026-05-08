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
