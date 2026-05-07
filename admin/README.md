# admin/ — 市场部官网管理后台

> 仅占位/规划阶段。完整 sprint 文档见 `SPRINT.md`。

## 是什么

让市场部不写代码就能改官网内容(新闻/banner/产品描述/图片)。

## 干嘛要看 SPRINT.md

接手前必读。里面写了:

- 视觉调性(跟主站 OPPO Sans+navy 对齐,推翻 4/25 v0)
- 文件位置(本目录 admin/ + content/ + templates/ + 服务器 /opt/admin-backend/)
- 关键功能(图片直连点选 + 公众号链接抓取)
- API 端点列表
- v1/v2 范围
- 接手步骤 9 项

## 当前状态

- ✅ Sprint 文档(SPRINT.md)
- ✅ 静态页面骨架(login/dashboard/editor/images/news/logs)
- ✅ content/*.json schema
- ✅ build_pages.py(v1 先写首页 hero/banner)
- ✅ Flask 后端本地 demo(admin/backend/,线上复制到 /opt/admin-backend/)
- ✅ 图片上传 resize + jpg/webp + images-manifest.json
- ✅ 新闻 CRUD + 公众号链接抓取 fallback
- ⬜ 部署 admin.hboyjd.com

## 本地启动

```powershell
python -m venv .venv-admin
.venv-admin\Scripts\python -m pip install -r admin\backend\requirements.txt
.venv-admin\Scripts\python admin\backend\app.py
```

打开: http://127.0.0.1:9005/admin/dashboard.html

本地默认 `ADMIN_AUTH_MODE=mock`，不需要钉钉凭证即可演示。

## 线上待接

- 复制 `admin/backend/` 到服务器 `/opt/admin-backend/`
- 设置 `HBOYJD_REPO_ROOT=/path/to/hboyjd-website`
- 设置 `ADMIN_AUTH_MODE=dingtalk`
- 设置钉钉凭证: `DINGTALK_CORP_ID` / `DINGTALK_AGENT_ID` / appSecret 相关变量
- 设置 `WECHAT_SYNC_SCRIPT=/opt/wechat-sync/sync.py`
- systemd 跑 9005，nginx 反代 `admin.hboyjd.com` 到 `127.0.0.1:9005`
- 模板见 `admin/deploy/admin-backend.service` 和 `admin/deploy/nginx-admin.hboyjd.com.conf`
