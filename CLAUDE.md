# 欧阳聚德官网 hboyjd.com

## 一句话
湖北欧阳聚德汽车的企业官网 + 特斯拉式选配器 + 配件中心。纯静态站，挂在阿里云香港轻量8.218.178.76 + Nginx。

## 项目地图

| 项 | 值 |
|---|---|
| 对外URL | https://hboyjd.com（HTTPS绿锁+HSTS）|
| 备用URL | https://www.hboyjd.com |
| 代码仓 | GitHub [Gefeier/hboyjd-website](https://github.com/Gefeier/hboyjd-website) · master |
| 本地工作区 | `G:/hboyjd-website/`（Windows墨主机。2026-04-23从iCloud迁移到G盘,避免iCloud冲突副本坑）|
| 生产部署 | `/www/wwwroot/hboyjd.com/` 在 8.218.178.76 |
| 负责墨 | Windows墨（主要）|
| 对应计划 | #15 数字化转型 + 企业官网重建 · **#55 销售物料赋能**（4/24 立项,PDF/画册/实拍包,跟 #15 并行） |
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
| `news.json` | 首页新闻栏目数据源（**2026-04-24 起已入 git**，12 条初始内容）|

**⚠️ 历史遗留（Git 部分未管理）**：`parts-data.json` 仓里还没有——当年手工上传到服务器未入库。如果要改这个文件，注意 `git pull` 不会拉新版，只能SSH到服务器直接改，或者本地改后 `scp` 上去。下次有精力统一时：把服务器版本作为权威拉回本地 → `git add` → 以后走正常流程。（`news.json` 已在 2026-04-24 入库，不再在此列表）

**⚠️ 历史坑（已消除）**：2026-04-23前这个仓在iCloud Drive里（`C:/Users/mac/iCloudDrive/欧阳聚德-官网/`），被iCloud冲突副本坑过一次(parts.html被误删~3min)。现已迁到G盘，问题消除。`.gitignore` 里的 `* 2.*` 规则保留作防御性设置（其他机器挂iCloud时有用）。

## 当前状态（2026-04-24）

**进行中**：
- 备案密码找回中（同事拨 027-87259311 办理，原备案号 鄂ICP备17030635号-1）
- 备案通过后：接入大陆服务器 + 阿里云DNS智能解析 + 注册百度/搜狗/360站长

**已上线**：
- HTTPS（Let's Encrypt ECC，acme.sh自动续）
- Google Search Console + Bing Webmaster 已验证+提交sitemap
- 导航栏"供应商合作"→ srm.hboyjd.com
- GitHub Webhook 自动部署
- **选配器 v1**：6车型动态规格 + AI基图 + Canvas HSL 换色 + 询价提交
- **百度统计**（国内）: HM_ID `65c76ffcec5fffefc264800dccf23f1b` 三页注入
- **Google Analytics 4**（海外）: `G-7XYYMJZCMZ` 三页注入
- **销售 WhatsApp**: `+86 15334225597` 覆盖 index / configurator 弹窗 / parts CTA
- **询价→钉钉推送链路**（2026-04-24 上线）: `POST /api/inquiry` → Nginx → Flask 9003（/opt/inquiry-proxy）→ 查 IP 地理 + 查手机归属 + 落库 `/var/log/inquiries.jsonl` → 钉钉"销售+市场工作群"机器人
- **首页新闻栏**: 12 条初始内容（公司动态/行业资讯/技术分享 各 4 条）
- **选配器手机端修复**（4/24）：原 `.vehicle-stage` 在 `max-width:1024px` 下 `display:none` 把核心小车藏了,改顶部 35vh 固定预览 + 下面 65vh 配置面板可滚(特斯拉/小米手机版同款);iOS Safari `100vh → 100dvh` + `env(safe-area-inset-bottom)` 适配全面屏 Home Indicator
- **配件中心热点图 v0**（4/24）：Hero 下加"配件位置导览"section,复用 `config-base-fence.png` 做侧视基图,4 热点(合页/侧标灯/反射器/前位灯)脉冲圆点,点击激活筛选 Tab + smoothScroll 跳分类锚点
- **首页图性能优化**（4/24）：Pillow `quality=85 + progressive + optimize`,`factory-gate.jpg` 6.2MB→460KB、`product-flatbed.jpg` 3.9MB→330KB,总省 86%(9.2MB),首页 4G 加载 ~10s→~1-2s;删 `team.jpg` 8.58MB 孤儿文件
- **#55 销售物料赋能计划立项**（4/24）：v1 做 1 款车型单页规格书 PDF(ReportLab 生成,A4 双面 8 页内),v2 其余 3 款+官网下载漏斗,v3 公司综合画册
- **WhatsApp 降权 + 抖音升位**（4/25）：3 页主 CTA 换抖音 `@hboyjd888`(短链 `https://v.douyin.com/T0RnzixERIQ/`),WhatsApp 降级"海外咨询(Overseas)";国内客户主流量从此进抖音,海外保留 WhatsApp
- **nginx 301 救 Google 老索引**（4/25）：老 PHP 站时代 `/news\d+\.html` 还在 Google 索引,客户搜公司名点过去 404 流失。加 301 → `/#news`,`/wap` → `/`;丽爸接的几个外贸询盘可能就是这条路径(经过站但 404 只记住公司名打电话)
- **公众号文章自动同步官网**（4/25）：AppID `wx7d4a5c9e358f05ec`,凭证存 `/etc/wechat-oa/credentials.env`(root 600);`/opt/wechat-sync/sync.py` 拉素材→news.json→git push;首次同步 4 篇覆盖公司动态(commit 960df1d)。**业务事实**:公众号 674 篇但 2021-11 后停更,需推动市场部恢复内容运营
- **首页新闻 3 栏重构**（4/25）：行业资讯/技术分享 → 党政动态/公司动态/客户案例,sync.py 双 API 合并(freepublish + material)按关键词路由 case>gov>company,客户案例时间窗口限制 ≤2 年
- **企业宣传片点播版**（4/25）：about 区后新增 `.promo-video` section,源 57s 砍前 35s 黑场 trim 37-57s 共 20s,H.264 720p CRF24 → 3.6MB(原 41MB),poster 取 40s 大楼帧 140KB,`preload=metadata` 不阻塞首屏
- **首页 hero 航拍背景视频**（4/25）：丽丽 17:14-17:20 大疆 4K HEVC 三段(540 主楼+542 车阵+538 屋顶OYJD),叙事序 538→540→542,xfade+首尾黑场,720p H.264 CRF25 静音 78s/14MB(源 1.15GB,省 99%);`preload="none"+data-src` JS `window.load` 后注入 source,首屏 LCP 不被视频阻塞;移动端 `display:none` 沿用 `factory-gate.jpg` fallback
- **手机端横向溢出全站修复**（4/25）：Playwright 320/375px 三页扫雷。**真凶**:`.news-columns grid-template-columns: 1fr` 等同 `minmax(auto, 1fr)`,被 `white-space: nowrap` 长标题撑成 553px(viewport 仅 375)。改 `repeat(3, minmax(0, 1fr))` 桌面+mobile 媒体查询同步。configurator vehicle-stage mobile 加 `overflow: hidden` 裁 driveIn 入场动画外溢;config-step animation 加 `both` fill-mode。全局兜底:`html/body { width:100%; max-width:100vw }` + `img/video/iframe { max-width:100% }`
- **访客分析周报脚本**（4/25）：`/opt/visitor-report/weekly_visitor_report.py` 读 `/www/wwwlogs/hboyjd.com.log`,排除内部 IP+爬虫+静态资源+4xx,通过 `ip-api.com` 查地理(45/min),输出 markdown 周报(国家分布/热门页/高意向访客 ≥ 5 次或看过选配/配件)。内部 IP 列表 `/opt/visitor-report/internal_ips.txt`(每行一个,需丽丽补充)

**待做**：
1. 产品详情页（平板/自卸/骨架/仓栅 四款，每页单独meta+sitemap）
2. 新闻栏自动更新（等丽丽拿公众号 AppID/AppSecret 或接 #35 新闻墨）
3. 选配器规格项对齐金蝶真字段（当前是行业常识编的，待 v2）
4. 小欧加入"销售+市场工作群"做高意向线索自动 @ 销售 + 报表
5. 首页图 JPG 已压缩 86%(4/24),但 **WebP `<picture>` 标签** + **Nginx Gzip/Brotli** 还没开（再省一轮 20-40%）
6. 外链冷启动（公众号/邮件签名/钉盘链接）
7. 爱企查官网字段改 hboyjd.com（等备案过）
8. 配件热点图 v1：让澜心画车前/车后视角基图,覆盖后尾灯/牌照灯/集装箱合页（侧视看不到的件）
9. #55 v1 PDF 样板：等丽丽选车型 + 补销售话术卖点 + 客户案例 + 资质扫描对外范围
10. **公众号同步挂 cron**(每天早 8 点跑 `/opt/wechat-sync/sync.py`)——脚本已上线但还没自动化,现在手动跑
11. **推动市场部恢复公众号内容运营**(2021-11 后停更,即使有同步脚本也没新内容可拉)
12. **更新 docx 公众号凭证流程**:2025-12-01 后入口迁到微信开发者平台,老路径"基本配置"已失效

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
- **不要替公司加虚假资质**（ISO 9001/XX认证等），除非丽丽明确说"我们有"。民用厂家夸大资质=虚假宣传。
- **前端 JS/CSS 改完要 bump `?v=`**（如 `configurator.js?v=20260424b`）否则浏览器缓存顽固，客户看到旧版。命名约定：`v=YYYYMMDD` + 字母小版本。
- **CSS Grid 列宽避坑**：任何 grid 列子元素含 `white-space: nowrap` / 长 URL / 长不可分中文，**必须** `grid-template-columns: minmax(0, 1fr)` 或 `repeat(N, minmax(0, 1fr))`。不要写裸 `1fr`（等于 `minmax(auto, 1fr)`，auto 会被 min-content 撑爆容器）。这是 4/25 新闻区"手机看不全"的根因。
- **Hero 背景视频性能要点**：`preload="none"` + `data-src` + JS `window.load` 后插入 `<source>`，避免 autoplay 阻塞首屏 LCP。移动端 `display:none` 走静态图 fallback。压缩用 H.264 720p CRF25 maxrate1.8M 静音，控制在 ≤15MB。
- **对外可见的测试消息不要写"墨"/"丽丽"**（钉钉群、服务器日志、公开 commit 等场合）。对外身份是 **Moira**，测试统一用 "Moira 联调" 之类中性称呼。墨和丽丽是内部对话用。
- **实拍 vs AI 渲染图分工**（4/24 定）：
  - 首页产品卡 → **实拍** `product-*.jpg`（B2B 客户看"产品中心"要真实感,每张场景不同有辨识度）
  - 选配器 → **AI 渲染** `config-base-*.png`（纯黑底一致性好）
  - 配件热点图 → **AI 渲染抽象版**（保护工艺,不给对家送细节）
  - #55 PDF 封面 → **AI 渲染** / 内页应用场景 → **实拍**
  不要把 AI 图塞到首页产品卡,也别把实拍高清堆到选配器——两套图互补不互斥。

## 🚨 合规红线（军工涉密，绝对不能出现）

欧阳聚德官网是**纯民用对外窗口**，任何军工/涉密内容都必须拦在发布前。泄露涉密信息涉及**刑事责任**。

**文字红线** — 下面这些词一律不能出现在任何HTML/JSON/meta/alt/标签里：

| 类别 | 禁用词举例 |
|---|---|
| 军方单位 | 部队、解放军、武警、军方、总装（指总装备部）、总后、总参 |
| 军用标准 | 军标、GJB、国军标、军品、军用、军工、军需 |
| 军用装备 | 迷彩、装甲、防弹、战术、战车、军车、军辆、武装 |
| 军工资质 | 军工资质、保密资质（即使真的有也不挂） |
| 涉密词 | 涉密、保密、机密、绝密、型号代号（带数字的"XX系列" ×）|
| 军方客户 | 即使合同真的做过，**合同方/客户名一字不提** |

**例外（保留）**：制造业术语和军事类只是字面相同的词——比如"**总装车间**" "**总装工序**"里的"总装"指总成装配，不是总装备部；"战略规划"里的"战略"也是商业词。判断标准：**这个词是不是在描述军方/军品/军用语境**？

**图片红线** — 加图前人工看一眼：
- 有无迷彩涂装（伪装色块、林地迷彩、沙漠迷彩）
- 有无军车辨识特征（军牌WJ/军绿、部队标识、装甲外壳）
- 有无穿军装/武警制服的人员
- 有无厂区背景里的敏感牌匾（"XX部件车间""军品区"等）

**触发点**：每次 push 前扫一次。Grep 命令模板：
```bash
cd G:/hboyjd-website && grep -rEn "军|国防|武装|装甲|武器|涉密|保密|机密|绝密|迷彩|防弹|部队|解放军|武警|总装备|总后|总参|GJB|军标|军品|军工|军用|军方" --include="*.html" --include="*.json" --include="*.js" --include="*.xml" --include="*.txt" --include="*.md" .
```
命中了停下来找墨/丽丽确认再决定改不改。

**已处理历史**：2026-04-23 删除 `index.html:138` "军标检验/Military Standard" 标签（commit c0e8c97）。

### ⚠️ 生产工艺保护（2026-04-24 丽丽定的商业红线）

军工红线之外，还有一条商业红线——**生产 know-how 不上公开官网**。

官网是**广告门面**，不是**产品画册**。客户要看"这东西装在哪"用抽象热点图/示意图；**生产细节特写 = 给对家送生产标准**。

**禁止上官网的**：
- 合页/车灯/反射器等配件的**装车实景特写**（涂料流挂纹理、铆钉焊点、铸件星标都看得见那种）
- 车间生产线正在组装的**工艺流程实拍**
- 钢板切割、焊接、涂装工序的**技术细节照**
- 任何能让同行"对着做"的 know-how 级画面

**可以上官网的**：
- 整车成品照片（厂区展示/已交车客户使用场景）
- AI 渲染的**抽象示意图**（`config-base-*.png` 这种干净纯背景）
- 配件白底商品图（市面通用无差异）
- 配件位置的**抽象热点图**（红色圆点标位置,点击看配件名,不看安装细节）

**判例**：2026-04-24 差点做合页 17 张装车实景图（原计划让澜心按实拍参考图生成），丽丽拦下——"这相当于生产细节了，容易有对家来爬内容"。方案改为整车抽象热点图 v0。参考文档 `G:\网站建设相关\hinge-prompts.md` 作废不再执行，实拍参考图 `IMG_20260316_180406.jpg` 内部存档不对外/不给 AI。

## 相关资源

- 部署/运维细节 → skill `website-deploy`
- 阿里云踩坑记录 → skill `aliyun-deploy`
- ICP备案办理材料 → `C:/Users/mac/Desktop/备案办理/hboyjd_接入备案办理清单.pdf`
- 服务器宝塔面板：`https://8.218.178.76:35560/9fc802d0`（密码在丽丽手里）
