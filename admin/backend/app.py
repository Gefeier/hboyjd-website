from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, jsonify, redirect, request, send_from_directory

import auth
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


@app.route("/api/auth/dingtalk-qrcode")
def auth_qrcode():
    return jsonify(auth.qrcode_payload())


@app.route("/api/auth/dingtalk-callback", methods=["POST"])
def auth_callback():
    user = auth.login_from_callback(request.get_json(silent=True) or {})
    append_log(user, "login", "auth", "登录后台")
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
    app.run(host="127.0.0.1", port=port, debug=os.getenv("ADMIN_DEBUG", "1") == "1")
