# 官网自有访问统计(2026-09-28 上线)

后台入口:https://admin.hboyjd.com/admin/traffic.html(和新闻管理同一个账号登录)

## 链路

```
访客浏览器 ── /assets/js/hit.js ──> GET https://hboyjd.com/_hit?e=pv|lv|ck&...
                                        │ Nginx 直接 204,只写日志
                                        ▼
                         /www/wwwlogs/hboyjd.hit.log(JSON 行)
                                        │ cron 每分钟
                                        ▼
         /opt/site-stats/ingest.py ──> /opt/site-stats/stats.db(pv / ev / sess 三表)
                                        │ 只读
                                        ▼
   admin-backend(Flask 9005)/api/stats/* ──> admin/traffic.html
```

- `pv` 每次页面浏览;`lv` 离开或切走时补报停留时长和滚动深度;`ck` 点电话、抖音、WhatsApp、邮件、外链、提交表单
- 访客 = 浏览器 localStorage 里的随机 ID;访问 = 30 分钟无操作算新的一次
- 地区 = 服务器本地 ip2region 离线库(`ip2region_v4.xdb` / `ip2region_v6.xdb`,不进 git,从 github.com/lionsoul2014/ip2region 的 data/ 下载)
- 内部设备:浏览器打开一次 `https://hboyjd.com/?internal=1`,之后都标成内部(页面默认不计);`?internal=0` 取消。`/opt/visitor-report/internal_ips.txt` 里的 IP 也按内部算

## 服务器文件

| 位置 | 作用 |
|---|---|
| `/opt/site-stats/ingest.py` `geo.py` | 本目录同名文件的部署副本(改完用 `tr -d '\r' < 文件 \| ssh hboyjd 'cat > /opt/site-stats/文件'` 推上去) |
| `/opt/site-stats/stats.db` | 统计库(SQLite,WAL) |
| `/www/server/panel/vhost/nginx/0.hboyjd_stats.conf` | Cloudflare 真实 IP 还原 + 埋点日志格式 + 限流,副本在 `nginx/` |
| `hboyjd.com.conf` 里的 `location = /_hit` | 副本在 `nginx/hit-location.conf` |
| root crontab `* * * * * ... ingest.py` | 日志 `/var/log/site-stats.log` |
| `/opt/admin-backend/stats_api.py` | 后台接口,改完要 `systemctl restart admin-backend` |

## 历史数据(埋点上线前)

`python3 ingest.py --backfill` 从 Nginx 主日志回填,只跑一次(重跑会先清旧回填)。口径是估算:

- 只要"打开页面后 2 分钟内同一访客加载了 css/js"的访问,伪装浏览器的扫描器只拉 HTML,这条筛掉九成
- 再去掉云服务器 IP、已知扫描机房(徐州电信 221.229 段等)、同一 /24 冒出 10 个以上 IP 的轮换机房(带搜索/微信/抖音来源或具体手机型号的真人访问保留)、一天超过 6 次访问的监控程序
- 2026-07-21 起站点接入 Cloudflare 代理,Nginx 当时没配真实 IP 还原,这段历史只有 Cloudflare 节点地址:地区为空,访客按"UA+日期"估。2026-09-28 已修好

## 改埋点脚本

改 `assets/js/hit.js` 后,改 `scripts/inject_tracker.py` 里的 VERSION 再跑一次,所有公开页面的引用版本号一起换。新增页面或重新生成英文版、车型页后也跑一次。
