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

**待做**：
1. 产品详情页（平板/自卸/骨架/仓栅 四款，每页单独meta+sitemap）
2. 新闻栏自动更新（等丽丽拿公众号 AppID/AppSecret 或接 #35 新闻墨）
3. 选配器规格项对齐金蝶真字段（当前是行业常识编的，待 v2）
4. 小欧加入"销售+市场工作群"做高意向线索自动 @ 销售 + 报表
5. 图片WebP化 + Gzip/Brotli开
6. 外链冷启动（公众号/邮件签名/钉盘链接）
7. 爱企查官网字段改 hboyjd.com（等备案过）

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
- **对外可见的测试消息不要写"墨"/"丽丽"**（钉钉群、服务器日志、公开 commit 等场合）。对外身份是 **Moira**，测试统一用 "Moira 联调" 之类中性称呼。墨和丽丽是内部对话用。

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

## 相关资源

- 部署/运维细节 → skill `website-deploy`
- 阿里云踩坑记录 → skill `aliyun-deploy`
- ICP备案办理材料 → `C:/Users/mac/Desktop/备案办理/hboyjd_接入备案办理清单.pdf`
- 服务器宝塔面板：`https://8.218.178.76:35560/9fc802d0`（密码在丽丽手里）
