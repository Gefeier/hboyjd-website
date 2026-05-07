# 市场部官网 admin 后台 · sprint kickoff

> 给澜心(或下一个接手的墨)。看完这一份就能开干。

**Plan**: #58 市场部内容管理后台 admin.hboyjd.com
**接手**: 澜心(Sonnet 即可,不需要 Opus)
**初稿创建**: 2026-05-07 chat 墨
**调性决策**: **推翻 4/25 v0 mock(Editorial Workshop 米白+琥珀),跟主站对齐**

## 视觉调性(必须遵守)

跟主站 hboyjd.com / about.html 完全一致:

| 项 | 值 |
|---|---|
| 中文字体 | OPPO Sans(已在 chinesefonts CDN 接入,跟陕汽对齐) |
| 英文 | OPPO Sans 内置英文 + fallback Inter |
| 主色 | navy-900 #0a1628 / blue-500 #2563eb / blue-300 #60a5fa |
| 辅色 | gold #d4a853(少用) |
| 中性 | white / gray-50 #f8fafc / gray-700 #334155 |
| 圆角 | 8-12px |
| 字号阶梯 | 36/22/18/16/14/13/12 |

**禁止**: SaaS 模板感、网格背景图案、紫粉色渐变、卡通图标、Editorial Workshop 那套米白+琥珀(已废弃)。

参考: `../style.css` :root 变量 + `../about.css`(去 SaaS 装饰版)

## 架构

```
[市场部小哥] →[admin.hboyjd.com 钉钉扫码登录]
        ↓
[admin UI 静态页(本目录 admin/)]
        ↓
[Flask API @ 服务器 9005]
        ├─ POST /api/auth/dingtalk-callback
        ├─ GET/PATCH /api/content/{section}    内容编辑
        ├─ POST /api/upload/image              图片上传(自动 resize+webp)
        ├─ POST /api/news/from-wechat-url      公众号链接抓取
        ├─ POST /api/publish                   触发发布(git commit+push)
        └─ GET /api/logs                       操作日志
        ↓
[改 hboyjd-website 仓库内容文件]
        ↓
[git commit + git push origin master]
        ↓
[GitHub webhook 触发服务器 git pull(已有)]
        ↓
[Nginx serve hboyjd.com 更新]
```

## 文件位置

```
G:/hboyjd-website/(本仓库)
├── admin/                       ⭐ admin UI 静态页(本目录)
│   ├── SPRINT.md                本文件
│   ├── README.md                本仓库 README
│   ├── login.html               钉钉扫码登录
│   ├── dashboard.html           工作台
│   ├── editor.html              内容编辑器(段落/timeline/honors)
│   ├── images.html              图片库浏览+上传+点选替换
│   ├── news.html                新闻管理(公众号链接抓取)
│   ├── logs.html                操作日志
│   ├── style.css                跟主站 OPPO Sans+navy 对齐
│   └── app.js                   API 调用 + 表单逻辑
├── content/                     ⭐ 内容数据(JSON,新增)
│   ├── about.json
│   ├── index.json
│   ├── timeline.json
│   ├── honors.json
│   ├── tags.json
│   └── images-manifest.json     图片清单(替换 SOURCE_INDEX.md)
├── templates/                   ⭐ Jinja2 模板(新增,Phase 1.5)
│   ├── about.html.jinja
│   └── index.html.jinja
├── build_pages.py               ⭐ 构建脚本(JSON+模板→HTML)
├── about.html                   现状(由 build_pages.py 生成)
├── index.html                   现状(由 build_pages.py 生成)
├── news.json                    现状
└── ...

服务器 /opt/admin-backend/(独立部署,不进 hboyjd-website 仓库)
├── app.py                       Flask 9005
├── auth.py                      钉钉 OAuth(参考 srm.hboyjd.com 实现)
├── content_io.py                读写 content/*.json + git push
├── image_processor.py           PIL resize+webp
├── wechat_fetcher.py            公众号文章抓取(参考 /opt/wechat-sync/sync.py)
├── audit_log.py                 操作日志
└── requirements.txt             Flask + pillow + requests + python-dingtalk-sdk + GitPython
```

## 关键功能(丽丽 5/7 加的两点)

### 功能 1: 图片直连点选/上传/替换

UI: editor.html 的图片字段不是输入框,是一个 thumbnail 卡。
- **点击 thumbnail** → 弹图片库 modal(images.html 内嵌) → 选已有图 or 上传新图
- **上传** → 后端自动:验证格式 → resize 长边 ≤ 1600 → 生成 jpg(quality 85)+webp(quality 80) → 写到 `assets/images/about/<basename>.{jpg,webp}` → 更新 `images-manifest.json`
- **替换确认** → 后端改对应 content/*.json 里的 image 字段 → 不立即 commit(等"发布"按钮)

后端: `POST /api/upload/image` body=multipart, 返回 `{basename, jpg_url, webp_url}`

### 功能 2: 新闻=公众号链接抓取

UI: news.html 顶部一个输入框 + "从公众号链接添加"按钮。
- 用户粘贴 `https://mp.weixin.qq.com/s/xxx`
- 后端抓取页面 → 解析 `<title>` `<meta property="og:image">` 发布日期 摘要(meta description)
- 入 `news.json` 一条 `{title, url, cover, date, summary, source: "wechat"}`
- 用户可在 UI 进一步编辑摘要/标题

后端: `POST /api/news/from-wechat-url` body=`{url}`
**复用现有**: `/opt/wechat-sync/sync.py` 已经在做公众号文章抓取,逻辑可以抽出来。

## 路由 / API

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/auth/me` | 当前登录用户 |
| GET | `/api/auth/dingtalk-qrcode` | 拿钉钉扫码 URL |
| POST | `/api/auth/dingtalk-callback` | 钉钉回调,issue token |
| GET | `/api/content/:section` | 读 content/<section>.json |
| PATCH | `/api/content/:section` | 写 content/<section>.json(暂存,不 commit) |
| GET | `/api/images` | 列 images-manifest.json |
| POST | `/api/upload/image` | 上传图片,后端 resize+webp |
| POST | `/api/news/from-wechat-url` | 公众号链接 → 抓取 → 入 news.json |
| POST | `/api/publish` | git add + commit + push,触发现有 webhook 部署 |
| GET | `/api/logs?limit=50` | 操作日志 |

## v1 必做

- [x] 钉钉扫码登录(参考 srm.hboyjd.com 实现)
- [x] **首页 banner 文案改**(几个固定字段)
- [x] **新闻 CRUD + 公众号链接抓取** ⭐ 5/7 新加
- [x] **图片库浏览 + 上传 + 点选替换** ⭐ 5/7 新加
- [x] 一键发布(git push)
- [x] 操作日志

## v2 推迟

- 改 about.html 全部内容(等 Phase 1.5 模板化完成)
- 多人协作冲突锁
- 审核工作流
- 富文本(v1 textarea + 几个简单按钮够)
- 移动端响应式
- 回滚 UI(走命令行救场)

## 推荐技术栈

- 前端: 静态 HTML + Tailwind CSS(自托管或 CDN) + 原生 JS(Fetch API)
- 后端: Flask + Pillow + requests + GitPython + python-dingtalk
- 部署: systemd unit `admin-backend.service` 跑 9005,Nginx 反代 admin.hboyjd.com → 127.0.0.1:9005
- DNS: `admin.hboyjd.com A 8.218.178.76 橙云开`
- SSL: Let's Encrypt(同 hboyjd.com 证书自动续)

## 接手步骤(给澜心)

1. **看本文件 + 跑一遍 about.html 现状**(localhost:3460/about.html)知道视觉调性
2. **打开旧 v0 mock**(https://files.moiralili.com/admin-mock/)只看页面分区结构,**视觉全部废弃**
3. **写第一版 admin/login.html + dashboard.html**(纯静态,跟 about.html 同 token)
4. **建 content/about.json schema**(把 about.html 里的内容反向抽取,见 about.html 现状)
5. **写 build_pages.py + about.html.jinja**,确保跑出来跟现在 about.html 一致
6. **服务器侧**:跟丽丽要 SSH 入口,在 /opt/admin-backend/ 建 Flask app
7. 钉钉 OAuth: 找丽丽要钉钉企业 corpId/agentId(她有钉盘那批 plan 里的凭证)
8. **API 实现顺序**: auth → content GET/PATCH → publish → upload → news/from-wechat-url → logs
9. 部署 systemd + nginx,验证 admin.hboyjd.com 能开

## 卡点 / 待丽丽决策

- [ ] **v1 主用户**(最常改官网的市场部那位是谁?)
- [ ] **审核要不要**(主管批了员工才能发,还是员工自拍板?)
- [ ] **改图片**(员工自己 P,还是设计师改完发员工只上传?)
- [ ] **回滚 UI vs 命令行救场**
- [ ] **上线节奏**(主管何时期望用上?)
- [ ] **钉钉 corpId/agentId 凭证**

## 历史决策(已对齐,不再讨论)

- 4/25: 自建后台,放弃 Notion-as-CMS(市场部不会用 Notion)
- 4/25: 钉钉扫码登录(员工已有钉钉,免新账号)
- 4/25: 域名 admin.hboyjd.com 子域(走 hboyjd 备案)
- 4/25: v0 视觉 Mock(Editorial Workshop)→ **5/7 推翻**,改为跟主站 OPPO Sans+navy 一致
- 5/7: 加图片直连点选/上传/替换
- 5/7: 加公众号链接抓取做 news 条目

## 相关 plan / 参考

- `#15` 数字化转型(本 admin 的母体)
- `#55` 销售物料赋能
- `#56` 公众号内容运营(news 数据源)
- 现成参考: `srm.hboyjd.com`(供应商门户,已有钉钉扫码登录 + 9002 端口 webhook 自动部署模板)
- 现成参考: `/opt/wechat-sync/sync.py` 公众号文章抓取
- 现成参考: `/opt/inquiry-proxy/app.py` Flask 9003 端口模板,**完全可以照抄结构**

## 联系

- 卡点写 plan #58 description 或 work_log
- 急事直接钉钉 / 微信 找丽丽
