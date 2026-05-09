# 市场部官网 admin 后台 · 接手手册

> 给澜心 / 任何接手的墨。看完这一份就能开干。

**Plan**: #58 市场部内容管理后台 admin.hboyjd.com
**初稿**: 2026-05-07 chat 墨
**最后更新**: 2026-05-09 chat 墨(沉淀 5/8-5/9 进度)
**当前状态**: **v1 完成 + 已上线生产**,后续维护期

---

## 一、版本时间线

| 时间 | 里程碑 | commit |
|---|---|---|
| 5/7 | sprint kickoff,SPRINT.md 初稿,后端骨架(钉钉 SSO 规划) | 81bd28c |
| 5/7 | 部署上线:DNS+SSL+nginx+systemd 9005 active | — |
| 5/7 | 拿到钉钉 AppSecret(chrome MCP hook fetch),凭证写 /etc/admin-backend/credentials.env | — |
| 5/8 | 钉钉 SSO 死路:开发平台「扫码登录第三方网站」能力没开,errcode 900103 应用不存在 | — |
| 5/8 | **改密码登录**(放弃钉钉 SSO),credentials.env 加 ADMIN_USERS_FILE | — |
| 5/8 | 账号管理上线:admin 增删/改密/改角色/停用,editor 改自己密码 | 724704d |
| 5/8 | 批量导入公众号 URL +L1 视觉对齐官网(navy/字距/gold) | 0fc6656 / c221c2c |
| 5/8 | wechat_fetcher 严格化:抓不到 og:title hard-fail 防垃圾 | 408e752 |
| 5/8 | 端到端测全过:admin 改 news → publish → 官网 5 秒生效 | f04ed76 |
| 5/8 | publish 修 2 bug:仓库 .git/config user.name+credential helper file 路径 | — |
| 5/8 | login 页厂区图毛玻璃 + sidebar 退出按钮 + modal [hidden] !important | c5b5b59/0ea8ca0/fbe4876 |
| 5/9 | 公众号 869 篇全量 dump(freepublish 23 + material 846) | — |
| 5/9 | 近 2 年 23 篇导入官网新闻栏(原 12+新增 13=25 条) | — |

---

## 二、视觉调性(必须遵守)

跟主站 hboyjd.com / about.html 完全一致:

| 项 | 值 |
|---|---|
| 中文字体 | OPPO Sans(chinesefonts CDN,跟陕汽对齐) |
| 主色 | navy-900 #0a1628 / blue-500 #2563eb |
| 辅色 | gold #d4a853(章节短线) |
| 中性 | white / gray-50 #f8fafc / gray-700 #334155 |
| 圆角 | 8-12px |
| 字距 | 标题 2px / CTA 2-4px |

**禁止**: SaaS 模板感、紫粉色渐变、卡通图标、Editorial Workshop 米白+琥珀。

参考:`../style.css` :root + `../about.css`

---

## 三、架构(当前)

```
[市场部 lily / marketing] →[admin.hboyjd.com 账号密码登录]
        ↓ HTTPS HSTS
[Nginx 443 反代 → 127.0.0.1:9005]
        ↓
[Flask admin-backend.service @ 9005]
        ├─ POST /api/auth/login         密码登录
        ├─ POST /api/auth/logout
        ├─ POST /api/auth/change-password (改自己密码)
        ├─ GET  /api/auth/me
        ├─ GET/POST /api/users          账号管理(admin 限)
        ├─ PATCH /api/users/<id>        改密/角色/停用
        ├─ GET/PATCH /api/content/<sec> 内容编辑
        ├─ POST /api/upload/image       图片上传 PIL resize+webp
        ├─ POST /api/news/from-wechat-url  公众号单条
        ├─ POST /api/news/batch-import     公众号批量(URL 数组)
        ├─ POST /api/publish            git commit+push
        └─ GET /api/logs                操作日志
        ↓
[/opt/hboyjd-website 工作区(独立 git pull)]
        ↓ git push origin master
[GitHub Gefeier/hboyjd-website]
        ↓ webhook
[/www/wwwroot/hboyjd.com → Nginx serve]
```

**关键**:`/opt/hboyjd-website` 跟 `/www/wwwroot/hboyjd.com` 是**两个独立目录**——admin 改前者+push,webhook 拉到后者。

---

## 四、文件位置

### 仓库内(G:/hboyjd-website/)

```
admin/
├── SPRINT.md                ← 本文件
├── login.html               账号密码登录(厂区图毛玻璃)
├── dashboard.html           工作台
├── news.html                新闻管理(单条+批量+列表)
├── editor.html              首页 hero 编辑(裸 form,待 L2 升级)
├── images.html              图片库
├── logs.html                操作日志
├── accounts.html            账号管理(admin 限)
├── style.css                navy 主调+OPPO Sans+gold 章节线
├── app.js                   API 调用+表单+sidebar 注入+modal
└── backend/                 ← 后端代码(开发态,部署到 /opt/admin-backend/)
    ├── app.py               Flask 路由
    ├── auth.py              密码登录+disabled 检查+touch_login
    ├── users_io.py          用户 CRUD threading.Lock+原子写
    ├── content_io.py        读写 content/*.json+publish
    ├── image_processor.py   PIL resize+webp
    ├── wechat_fetcher.py    公众号 og:title 抓取(严格化)
    ├── audit_log.py         操作日志
    └── requirements.txt     Flask>=3.0 Pillow>=10 requests GitPython
```

### 服务器(8.218.178.76)

```
/opt/admin-backend/           ← Flask 运行目录(.venv + 上面 backend/ 的拷贝)
/etc/admin-backend/
├── credentials.env           ← root 600,DINGTALK_*+ADMIN_USERS_FILE
└── users.json                ← root 600,bcrypt 哈希(werkzeug pbkdf2)
/etc/systemd/system/admin-backend.service
/var/log/admin-actions.jsonl  ← 审计日志
/www/server/panel/vhost/nginx/admin.hboyjd.com.conf
/www/server/panel/vhost/cert/admin.hboyjd.com/{fullchain,privkey}.pem
/opt/hboyjd-website/          ← admin 工作仓库(独立 git pull)
  └── .git/config             ← 改过:user.name+credential.helper="store --file=/root/.git-credentials"
```

---

## 五、运维命令速查

```bash
# 看状态
ssh hboyjd 'systemctl status admin-backend'
ssh hboyjd 'tail -50 /var/log/admin-actions.jsonl'
ssh hboyjd 'journalctl -u admin-backend -n 100'

# 改代码后重新部署
cd /g/hboyjd-website && git push origin master
ssh hboyjd 'cd /opt/hboyjd-website && git pull && cp admin/backend/*.py /opt/admin-backend/ && systemctl restart admin-backend'

# 改钉钉/账号凭证
ssh hboyjd 'nano /etc/admin-backend/credentials.env && systemctl restart admin-backend'

# 加用户(走 admin UI 最稳,或者 ssh 直接编辑 users.json)
# 直接走 https://admin.hboyjd.com/admin/accounts.html 用 admin 账号点

# 看 publish 是否能 push(诊断 git config)
ssh hboyjd 'cd /opt/hboyjd-website && git push --dry-run'
```

---

## 六、v1 完成清单 ✓

- [x] 账号密码登录(替代钉钉 SSO)
- [x] 账号管理:admin 增删/改密/角色/停用,editor 改自己密码
- [x] 防自删/降级(admin 不能停用自己/降级自己)
- [x] 新闻 CRUD + 公众号单条+批量抓取
- [x] 图片库浏览+上传+点选替换 (PIL jpg+webp)
- [x] 首页 hero 内容编辑(基础)
- [x] 一键发布 git push
- [x] 操作日志 jsonl
- [x] 操作审计(每个 PATCH/PUBLISH 都进 audit_log)
- [x] 视觉对齐官网 navy + OPPO Sans + gold

---

## 七、v1.5 待办(优先级排序)

### 1. 首页荣誉/核心优势对齐 about.html
**问题**:首页只 4 张荣誉卡 + 4 张优势卡(写死的),about.html 有完整 14 张荣誉 + 完整数据版优势区。**首页过时**。
**做法**:把 index.html 荣誉/优势区抄 about.html 数据,或者把这俩区块改用 content/index.json + build_pages.py 生成。
**文件**:`index.html` L287-346(advantages+honors 区块),`about.html` 已有完整版做参考。

### 2. editor.html L2 区块仿真预览
**问题**:editor 是裸 form,字段名「hero-title-en」对市场部不直观。
**做法**:左边表单 + 右边「首页 Hero 真实模板缩略卡」(navy 大背景,改字段实时反映)。
**预算**:60-90 分钟。

### 3. news.html 列表卡片化精雕
**问题**:新闻列表是一栏堆叠,缺上下移、按分类过滤、按搜索。
**做法**:列表加 toolbar(搜索+分类筛选)+每条卡片加"上移/下移/复制 URL"按钮。
**预算**:30-40 分钟。

### 4. 历史 800+ 篇公众号文章选择性导入
**前提**:material API 拉到 846 篇 2017-2021,但 url 浏览器活性未验证(curl 全部失败,微信反爬)。
**做法**:等 chrome MCP 空了,playwright 跑一遍真渲染验证 og:title,活的精选 ~30 篇按品牌价值导入。
**数据已就绪**:`G:/dingtalk_bot/downloads/cleaned_articles.json`(869 篇全量) + `import_candidates.json`(59 候选)。

### 5. wechat_fetcher.py date 字段兜底 bug
**问题**:抓不到 `publish_time` 时兜底成 today,批量导入时部分文章日期错乱。
**做法**:date 字段抓不到改为 raise(让 batch-import 标失败),或者从 mid 参数推算。

### 6. (可选) 多人协作锁
**问题**:两人同时编辑同一 content 文件会丢失改动。
**做法**:文件级 ETag/version 字段,PATCH 带版本号,不一致拒。
**优先级**:目前只 lily 单人用,不急。

---

## 八、已知 bug / 注意事项

1. **wechat_fetcher 日期 bug**:见 v1.5 待办 #5
2. **首页 fetch news.json 用 UA 校验**:nginx 拒默认 curl UA 返 403,带浏览器 UA OK。这是预期防爬,但调试时容易被误以为是 bug
3. **publish 必须仓库内有 git config user.name + credential.helper="store --file=/root/.git-credentials"**:已改过 /opt/hboyjd-website/.git/config,新机器部署要重新配
4. **systemd EnvironmentFile 必须 root 600**:credentials.env / users.json 同等敏感,跟 srm 同等保护
5. **删除用户故意不实现**:防 audit_log 找不到 userid 关联,只能 PATCH disabled

---

## 九、决策历史(已对齐)

- 4/25: 自建后台,放弃 Notion-as-CMS(市场部不会用 Notion)
- 4/25: 域名 admin.hboyjd.com 子域(走 hboyjd 备案)
- 5/7: 视觉 v0 mock(Editorial Workshop 米白+琥珀) → **推翻**改 navy 对齐主站
- 5/7: 加图片直连点选/上传/替换
- 5/7: 加公众号链接抓取
- **5/8: 钉钉 SSO 死路 → 改账号密码登录**(钉钉开发平台「扫码登录第三方网站」能力没开,errcode 900103;凭证存在但 SSO 没注册)
- 5/8: 角色两级:admin / editor(不加 viewer,2-3 用户够)
- 5/8: 删除入口故意不做,只 PATCH disabled(保留审计追溯)
- 5/8: 默认禁用钉钉 SSO,但代码留着(`AUTH_MODE=dingtalk` 还能切回去)

---

## 十、相关 plan / 参考

- `#15` 数字化转型(本 admin 的母体)
- `#55` 销售物料赋能
- `#56` 公众号内容运营
- `#54` SRM(供应商招投标系统,密码登录参考实现)
- 现成参考:`/opt/wechat-sync/sync.py` 公众号 freepublish+material 双 API

## 十一、密码 / 凭证位置

**永远不进 git/skill/chat:**
- `/etc/admin-backend/credentials.env` (root 600)
  - DINGTALK_CORP_ID/AGENT_ID/APP_KEY/APP_SECRET (留着备用,当前不用)
  - ADMIN_AUTH_MODE=password
  - ADMIN_USERS_FILE=/etc/admin-backend/users.json
- `/etc/admin-backend/users.json` (root 600)
  - werkzeug pbkdf2:sha256:600000 哈希
  - 字段:userid/name/role/password_hash/disabled/created_at/last_login

## 十二、联系

- 卡点写 plan #58 description 或 work_log
- 急事钉钉/微信找丽丽
