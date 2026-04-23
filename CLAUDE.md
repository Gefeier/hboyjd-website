# 欧阳聚德官网 hboyjd.com

## 一句话
湖北欧阳聚德汽车的企业官网 + 特斯拉式选配器 + 配件中心。纯静态站，挂在阿里云香港轻量8.218.178.76 + Nginx。

## 项目地图

| 项 | 值 |
|---|---|
| 对外URL | https://hboyjd.com（HTTPS绿锁+HSTS）|
| 备用URL | https://www.hboyjd.com |
| 代码仓 | GitHub [Gefeier/hboyjd-website](https://github.com/Gefeier/hboyjd-website) · master |
| 本地工作区 | `C:/Users/mac/iCloudDrive/欧阳聚德-官网/`（Windows墨主机）|
| 生产部署 | `/www/wwwroot/hboyjd.com/` 在 8.218.178.76 |
| 负责墨 | Windows墨（主要）|
| 对应计划 | #15 数字化转型：订单全流程数字化 + 企业官网重建 |
| 相关skill | `website-deploy`（墨部署运维手册）|

## 部署方式

**自动部署**：本地改 → `git push origin master` → GitHub → Webhook命中 → 服务器 `git pull` → Nginx直接serve。**不用重启任何服务**（纯静态）。

Webhook地址：`https://hboyjd.com/hboyjd-deploy-webhook`（HMAC签名验证，secret存在服务器环境变量 `WH_SECRET`）。

SSH接入看 skill `website-deploy` 或 `aliyun-deploy`——走 `ssh.moiralili.com`（CF Named Tunnel）。

## 关键文件

| 文件 | 作用 |
|---|---|
| `index.html` | 首页，含SEO meta/sitemap链接 |
| `configurator.html` + `.css` + `.js` | 特斯拉式选配器 |
| `parts.html` + `parts-data.json` + `parts.css` | 配件中心 |
| `style.css` | 全站字体/布局/配色 |
| `main.js` | 首页交互（轮播、滚动效果等）|
| `assets/` | 图片、图标、字体 |
| `sitemap.xml` | 搜索引擎站点地图（改完记得同步加url）|
| `robots.txt` | 爬虫规则（百度/搜狗/360/Google/Bing开）|
| `news.json` | 新闻栏目数据（目前挂在首页）|

**⚠️ 历史遗留（Git未管理）**：`news.json` 和 `parts-data.json` 本地有、生产有、**仓里没有**——当年手工上传到服务器未入库。如果你要改这两个文件，注意 `git pull` 不会拉新版，只能SSH到服务器直接改，或者本地改后 `scp` 上去。下次有精力统一时：把服务器版本作为权威拉回本地 → `git add` → 以后走正常流程。

**⚠️ iCloud同步坑**：这个目录在iCloud Drive里，iCloud偶尔把文件同步成 `xxx 2.html` 冲突副本。`.gitignore` 已加 `* 2.*` / `* 3.*` 规则，不会再被误commit。但如果你发现关键文件突然"消失"，先找一下有没有带数字后缀的冲突副本。

## 当前状态（2026-04-21）

**进行中**：
- 备案密码找回中（同事拨 027-87259311 办理，原备案号 鄂ICP备17030635号-1）
- 备案通过后：接入大陆服务器 + 阿里云DNS智能解析 + 注册百度/搜狗/360站长

**已上线**：
- HTTPS（Let's Encrypt ECC，acme.sh自动续）
- Google Search Console + Bing Webmaster 已验证+提交sitemap
- 导航栏加了"供应商合作"→ srm.hboyjd.com 入口
- GitHub Webhook自动部署

**待做（#15的456789慢慢来）**：
1. 产品详情页（平板/自卸/骨架/仓栅 四款，每页单独meta+sitemap）
2. 关于我们 + 新闻栏目独立页
3. 图片WebP化 + Gzip/Brotli开
4. 外链冷启动（公众号/邮件签名/钉盘链接）
5. 爱企查官网字段改 hboyjd.com（等备案过）

## 给接手墨：从哪下手

1. **只是改文案/meta/换图** → 本地改 → `git commit` → `git push origin master` → 1分钟后线上生效
2. **加新页面** → 新建 `.html` → 加到 `sitemap.xml` → 首页/导航加链接 → push
3. **改站点配置（Nginx/SSL/备案相关）** → 读 skill `website-deploy`，走SSH改 `/www/server/panel/vhost/nginx/hboyjd.com.conf`
4. **服务器爆炸/404/502** → 读 skill `website-deploy` 的"常见问题"章节
5. **完全不知道从哪看起** → 先 `work_list(plan_id=15)` 看计划日志最新卡点

## 约定

- **不要用 `git add -A`** ← 会把 `.well-known/` ACME验证文件加进来
- **改 `index.html` 的meta时保留已有验证码**（`google-site-verification` 已是真值，别覆盖成PLACEHOLDER）
- **图片放 `assets/`**，命名用英文小写+横杠（`flatbed-truck.jpg`，不是 `平板车.jpg`）
- **中文内容统一UTF-8无BOM**（PowerShell打开要注意编码）
- **改动完毕** → `work_log(plan_id=15, action=..., content=...)` ≤300字；`board_post(plan_id=15, summary=..., source=...)` ≤50字

## 相关资源

- 部署/运维细节 → skill `website-deploy`
- 阿里云踩坑记录 → skill `aliyun-deploy`
- ICP备案办理材料 → `C:/Users/mac/Desktop/备案办理/hboyjd_接入备案办理清单.pdf`
- 服务器宝塔面板：`https://8.218.178.76:35560/9fc802d0`（密码在丽丽手里）
