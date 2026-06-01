# 新闻系统 v2 重构设计 · 极简手动工作流 + 原创新闻站内页

**起草**：chat 墨
**日期**：2026-06-01
**触发**：丽丽看 v1 全字段编辑器(每条摊开 标题/日期/摘要/分类/封面/url/删除)觉得太繁琐——"看着都觉得麻烦"。重新定义为极简手动工作流。
**关联**：#58 市场部内容管理后台

---

## 丽丽 6/1 拍板的需求(AskUserQuestion 确认)

1. **三模块分栏简洁视图**:公司动态/党政动态/客户案例三栏,一眼看到每栏有哪几条、共几条,不展开一堆字段
2. **每模块粘链接即上**:某模块下一个框,粘公众号链接→自动抓标题/封面/摘要→进该模块→上官网。不手填细节、不单独点保存(操作即存)
3. **原创新闻 + 站内详情页**:不靠公众号链接,后台直接写一篇(标题+正文+配图),官网**能点开读全文**(独立链接可转发)
4. **纯手动**:不要自动同步。已停 cron(6/1 注释 crontab)、已清掉自动拉的 28 篇待审,回到 12 篇

## 当前基线(已就位)

- `news.json` 文章池:12 篇手动精选,REPO_ROOT=/opt/hboyjd-website 与 admin 同 working copy
- 官网渲染:`main.js` L110 fetch news.json,L115 filter site_visible,L125 按 category slice(PER_COL)。新闻卡片点击 → `item.url`(公众号外链)
- admin:`news.html` + `app.js`(全字段卡片列表,**本次要换**)
- 抓取:`wechat_fetcher.py` fetch_wechat_article(url) 抓 og:title/封面/摘要/日期,已是好的 merge(append_news 按 url 去重保字段)
- `sync.py` v6:cron 已停,**单 URL 模式只读(只供手动场景)**,全量进货逻辑保留备用

## v2 设计

### A. admin 新闻管理重构(news.html + app.js)
- 三 tab 或三栏分组:公司动态 / 党政动态 / 客户案例,每组标题带计数"(N 条)"
- 每组列表极简:封面缩略 + 标题 + 日期 + [隐藏👁] [删除]。**不再默认展开 摘要/url/分类下拉**(要改细节点"展开"再说)
- 每组顶部一个粘链接框:粘公众号 URL → 调 `/api/news/from-wechat-url`(已有) 抓取 → 自动归入**当前这个模块的 category** → 即时 saveSection,不用再点"保存新闻列表"
- 去掉繁琐:批量导入框可收进"高级"折叠;全字段编辑降级为单条"编辑"按钮点开

### B. 原创新闻编辑器(新)
- admin 新入口"写原创新闻":标题 + 正文(简单富文本或 markdown) + 封面 + 分类
- 存进 news.json,新字段:`body`(正文 HTML/md)、`source:"original"`、`url` 指向站内页 `/news-detail.html?id=<id>`
- 复用图片上传 `/api/upload/image`

### C. 站内新闻详情页(新组件,工作量大头)
- 新模板 `news-detail.html`:读 `?id=` → fetch news.json 找该条 → 渲染 标题/日期/封面/正文 body。navy 风对齐主站
- 官网新闻栏点击逻辑(main.js):`source==="original"` → 跳 `/news-detail.html?id=`;公众号文章 → 跳 `item.url` 外链
- sitemap:原创新闻 url 进 sitemap(SEO);公众号外链不进

## 工作量与拆分(约 1 天)
1. admin 前端三栏极简重构(news.html+app.js+style.css) — 半天
2. 原创新闻编辑器(admin 新页/区 + app.py 存 body) — 2-3h
3. 站内详情页 news-detail.html + main.js 点击分流 — 2-3h
4. 全链路测 + sitemap — 1h

## 接手入口
从 A 开始(改 news.html 三栏 + 粘链接即存)。原创+站内页(B/C)是新功能,建议作为独立一段专注做。
现有 wechat_fetcher/append_news/upload 接口可直接复用,不用重写后端抓取。
