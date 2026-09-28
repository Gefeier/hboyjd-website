#!/usr/bin/env python3
"""官网访问统计入库。

每分钟由 cron 跑一次:读 /_hit 埋点日志的新增部分 → stats.db(pv / ev / sess 三张表)。
  python3 ingest.py              增量入库(cron 用)
  python3 ingest.py --backfill   一次性把 Nginx 主日志里埋点上线前的页面访问回填进来(估算口径)
  python3 ingest.py --rebuild-sess  按 pv 表重算全部会话

兼容服务器系统自带的 Python 3.6,只用标准库。
"""
import bisect
import hashlib
import ipaddress
import json
import os
import re
import sqlite3
import sys
import time
import warnings
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs, urlsplit

import geo

warnings.filterwarnings("ignore")

HERE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("STATS_DB", os.path.join(HERE, "stats.db"))
HIT_LOG = os.environ.get("STATS_HIT_LOG", "/www/wwwlogs/hboyjd.hit.log")
MAIN_LOG = os.environ.get("STATS_MAIN_LOG", "/www/wwwlogs/hboyjd.com.log")
SITE_ROOT = os.environ.get("STATS_SITE_ROOT", "/www/wwwroot/hboyjd.com")
INTERNAL_IPS_FILE = os.environ.get("STATS_INTERNAL_IPS", "/opt/visitor-report/internal_ips.txt")

CST = timezone(timedelta(hours=8))
SESSION_GAP = 1800
OWN_HOST = "hboyjd.com"

BOT_RE = re.compile(
    r"bot\b|bot/|spider|crawl|slurp|fetch|scan|monitor|preview|headless|phantom|lighthouse|pagespeed|"
    r"inspectiontool|python|curl|wget|go-http|java/|okhttp|httpclient|scrapy|axios|node-fetch|"
    r"bytespider|petalbot|yandex|ahrefs|semrush|mj12|dotbot|facebookexternalhit|embedly|"
    r"feishu|lark|whatsapp/|telegram|discord|skype|slackbot|bingpreview|qwantify|applebot",
    re.I)

CF_NETS = [ipaddress.ip_network(x) for x in (
    "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18",
    "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17",
    "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
    "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32",
    "2a06:98c0::/29", "2c0f:f248::/32")]

SEARCH = [
    ("baidu.com", "百度搜索"), ("google.", "谷歌搜索"), ("bing.com", "必应搜索"), ("sogou.com", "搜狗搜索"),
    ("so.com", "360搜索"), ("360.cn", "360搜索"), ("sm.cn", "神马搜索"), ("so.toutiao.com", "头条搜索"),
    ("yandex.", "其他搜索引擎"), ("duckduckgo.com", "其他搜索引擎"), ("yahoo.", "其他搜索引擎"),
    ("naver.com", "其他搜索引擎"), ("ecosia.org", "其他搜索引擎"),
]
AI_HOSTS = ("chatgpt.com", "openai.com", "perplexity.ai", "kimi.", "moonshot.cn", "doubao.com", "deepseek.com",
            "yuanbao.tencent.com", "tongyi.", "qianwen.", "copilot.microsoft.com", "gemini.google.com", "claude.ai",
            "metaso.cn", "chatglm.cn", "xinghuo.xfyun.cn")
SOCIAL = [
    ("weixin.qq.com", "微信"), ("servicewechat.com", "微信"), ("douyin.com", "抖音"), ("iesdouyin.com", "抖音"),
    ("toutiao.com", "今日头条"), ("xiaohongshu.com", "小红书"), ("xhslink.com", "小红书"), ("weibo.", "微博"),
    ("zhihu.com", "知乎"), ("qq.com", "QQ"), ("dingtalk.com", "钉钉"), ("bilibili.com", "B站"),
    ("facebook.com", "Facebook"), ("linkedin.com", "LinkedIn"), ("youtube.com", "YouTube"),
    ("t.co", "X/推特"), ("x.com", "X/推特"), ("alibaba.com", "阿里巴巴"), ("1688.com", "1688"),
]
APP_UA = [
    ("wxwork", "企业微信"), ("micromessenger", "微信"), ("dingtalk", "钉钉"), ("aweme", "抖音"),
    ("bytedancewebview", "抖音"), ("newsarticle", "今日头条"), ("xhsdiscover", "小红书"), ("weibo", "微博"),
    ("baiduboxapp", "百度App"), (" qq/", "QQ"), ("zhihu", "知乎"),
]
BROWSERS = [
    ("wxwork", "企业微信"), ("micromessenger", "微信"), ("dingtalk", "钉钉"), ("aweme", "抖音"),
    ("bytedancewebview", "抖音"), ("newsarticle", "今日头条"), ("xhsdiscover", "小红书"), ("weibo", "微博"),
    ("baiduboxapp", "百度App"), (" qq/", "QQ"), ("mqqbrowser", "QQ浏览器"), ("ucbrowser", "UC浏览器"),
    ("quark", "夸克"), ("huaweibrowser", "华为浏览器"), ("miuibrowser", "小米浏览器"), ("vivobrowser", "vivo浏览器"),
    ("heytapbrowser", "OPPO浏览器"), ("oppobrowser", "OPPO浏览器"), ("samsungbrowser", "三星浏览器"),
    ("360se", "360浏览器"), ("qihoobrowser", "360浏览器"), ("edg/", "Edge"), ("edga/", "Edge"), ("edgios", "Edge"),
    ("firefox", "Firefox"), ("fxios", "Firefox"), ("crios", "Chrome"), ("chrome", "Chrome"), ("safari", "Safari"),
]


def is_bot(ua):
    return (not ua) or ("mozilla/" not in ua.lower()) or bool(BOT_RE.search(ua))


def parse_ua(ua):
    u = (ua or "").lower()
    if "ipad" in u or "tablet" in u or ("android" in u and "mobile" not in u and "harmony" not in u):
        device = "平板"
    elif any(k in u for k in ("iphone", "mobile", "android", "harmonyos", "openharmony")):
        device = "手机"
    else:
        device = "电脑"
    if "harmony" in u:
        os_ = "鸿蒙"
    elif "iphone" in u or "ipad" in u or "ios" in u:
        os_ = "iOS"
    elif "android" in u:
        os_ = "Android"
    elif "windows" in u:
        os_ = "Windows"
    elif "mac os x" in u or "macintosh" in u:
        os_ = "macOS"
    elif "linux" in u:
        os_ = "Linux"
    else:
        os_ = "其他"
    browser = next((name for key, name in BROWSERS if key in u), "其他")
    return device, os_, browser


def host_of(url):
    try:
        return (urlsplit(url).hostname or "").lower()
    except ValueError:
        return ""


def classify(ref, ua, query):
    """返回 (渠道, 来源域名)。优先级:推广参数 > 引荐域名 > App 内置浏览器 > 直接访问。"""
    q = parse_qs(query or "")
    utm = (q.get("utm_source") or [""])[0].strip()
    if utm and re.match(r"^[\w\-. 一-龥]{1,30}$", utm):
        return "推广:" + utm[:20], host_of(ref)
    if "bd_vid" in q or "gclid" in q:
        return "付费推广", host_of(ref)
    h = host_of(ref)
    if h:
        if h == OWN_HOST or h == "www." + OWN_HOST:
            return "站内", h
        if h.endswith("." + OWN_HOST):
            return "公司子站", h
        for key, name in SEARCH:
            if key in h:
                return name, h
        if any(k in h for k in AI_HOSTS):
            return "AI助手", h
        for key, name in SOCIAL:
            if h == key or h.endswith("." + key) or (key.endswith(".") and key in h):
                return name, h
        return "外部链接", h
    u = (ua or "").lower()
    for key, name in APP_UA:
        if key in u:
            return name, ""
    return "直接访问", ""


DATACENTER_RE = re.compile(
    r"阿里|华为|腾讯|百度|金山|京东|UCloud|青云|世纪互联|Amazon|AWS|Google|Microsoft|DigitalOcean|Linode|Akamai|"
    r"OVH|Hetzner|Oracle|Vultr|Choopa|Alibaba|Tencent|Huawei|Cloudflare|Contabo|M247|Leaseweb|Hostinger|"
    r"Zenlayer|DataCamp|G-Core|Datacamp|Hosting|Host|Server|Cloud|IDC", re.I)
# 已知扫描机房:徐州电信 221.229 段轮换几百个 IP、会加载 css/js;另两段见 Nginx deny 规则
BLOCKED_NETS = [ipaddress.ip_network(x) for x in ("221.229.0.0/16", "123.160.223.0/24", "111.170.187.0/24")]


def is_machine(ip, isp):
    """云服务器 / 已知机房来的访问,当机器处理。"""
    if isp and DATACENTER_RE.search(isp):
        return True
    try:
        a = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return any(a in n for n in BLOCKED_NETS)


HUMAN_UA_RE = re.compile(r"micromessenger|aweme|bytedancewebview|dingtalk|baiduboxapp|harmony| build/|xhsdiscover", re.I)


def strong_human(ua, ref):
    """带明显真人特征:从搜索/社交点进来、App 内打开、带具体手机型号。手机网络的共享 IP 池靠这条留住。"""
    if ua and HUMAN_UA_RE.search(ua):
        return 1
    ch, _ = classify(ref or "", "", "")
    return 1 if ch not in ("直接访问", "站内", "公司子站", "外部链接") else 0


def is_cf(ip):
    try:
        a = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return any(a in n for n in CF_NETS)


def load_internal_ips():
    ips = set()
    try:
        with open(INTERNAL_IPS_FILE, encoding="utf-8") as f:
            for ln in f:
                ln = ln.split("#", 1)[0].strip()
                if ln:
                    ips.add(ln)
    except OSError:
        pass
    return ips


def day_hour(ts):
    t = datetime.fromtimestamp(ts, CST)
    return t.strftime("%Y-%m-%d"), t.hour


SCHEMA = """
CREATE TABLE IF NOT EXISTS pv (
    id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, day TEXT NOT NULL, hour INTEGER,
    src TEXT NOT NULL, pid TEXT UNIQUE, vid TEXT, sid TEXT, seq INTEGER, is_new INTEGER DEFAULT 0,
    internal INTEGER DEFAULT 0, ip TEXT, country TEXT, province TEXT, city TEXT, isp TEXT,
    path TEXT, query TEXT, title TEXT, ref TEXT, ref_host TEXT, channel TEXT,
    device TEXT, os TEXT, browser TEXT, sw INTEGER, lang TEXT, ua TEXT,
    active_ms INTEGER DEFAULT 0, scroll INTEGER DEFAULT 0, bot INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS pv_day ON pv(day);
CREATE INDEX IF NOT EXISTS pv_ip ON pv(ip);
CREATE INDEX IF NOT EXISTS pv_sid ON pv(sid);
CREATE INDEX IF NOT EXISTS pv_vid ON pv(vid);
CREATE TABLE IF NOT EXISTS ev (
    id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, day TEXT NOT NULL, vid TEXT, sid TEXT, pid TEXT,
    internal INTEGER DEFAULT 0, kind TEXT, target TEXT, path TEXT);
CREATE INDEX IF NOT EXISTS ev_day ON ev(day);
CREATE INDEX IF NOT EXISTS ev_sid ON ev(sid);
CREATE TABLE IF NOT EXISTS sess (
    sid TEXT PRIMARY KEY, vid TEXT, src TEXT, day TEXT, start_ts INTEGER, end_ts INTEGER,
    pages INTEGER, landing TEXT, landing_title TEXT, exit_path TEXT, channel TEXT, ref_host TEXT, ref TEXT,
    ip TEXT, country TEXT, province TEXT, city TEXT, isp TEXT, device TEXT, os TEXT, browser TEXT,
    active_ms INTEGER, actions TEXT, visit_no INTEGER, internal INTEGER DEFAULT 0, bot INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS sess_day ON sess(day);
CREATE INDEX IF NOT EXISTS sess_vid ON sess(vid);
CREATE INDEX IF NOT EXISTS sess_start ON sess(start_ts);
CREATE TABLE IF NOT EXISTS state (k TEXT PRIMARY KEY, v TEXT);
"""


def connect():
    con = sqlite3.connect(DB_PATH, timeout=30)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.executescript(SCHEMA)
    return con


def get_state(con, k, default=None):
    r = con.execute("SELECT v FROM state WHERE k=?", (k,)).fetchone()
    return r[0] if r else default


def set_state(con, k, v):
    con.execute("INSERT OR REPLACE INTO state (k, v) VALUES (?, ?)", (k, str(v)))


def norm_path(path):
    path = path or "/"
    if path.endswith("/index.html"):
        path = path[:-len("index.html")]
    return path


PV_COLS = ("ts", "day", "hour", "src", "pid", "vid", "sid", "seq", "is_new", "internal", "ip", "country",
           "province", "city", "isp", "path", "query", "title", "ref", "ref_host", "channel", "device", "os",
           "browser", "sw", "lang", "ua", "bot")


def insert_pv(con, row):
    con.execute("INSERT OR IGNORE INTO pv (%s) VALUES (%s)" % (",".join(PV_COLS), ",".join("?" * len(PV_COLS))),
                [row.get(c) for c in PV_COLS])


def rebuild_sessions(con, sids):
    for sid in sids:
        rows = con.execute("SELECT * FROM pv WHERE sid=? ORDER BY ts, seq", (sid,)).fetchall()
        if not rows:
            continue
        first, last = rows[0], rows[-1]
        acts = [r[0] for r in con.execute("SELECT DISTINCT kind FROM ev WHERE sid=? ORDER BY kind", (sid,))]
        prev = con.execute("SELECT COUNT(*) FROM sess WHERE vid=? AND start_ts<? AND sid<>?",
                           (first["vid"], first["ts"], sid)).fetchone()[0]
        end_ts = max(r["ts"] + (r["active_ms"] or 0) // 1000 for r in rows)
        con.execute(
            "INSERT OR REPLACE INTO sess (sid, vid, src, day, start_ts, end_ts, pages, landing, landing_title, "
            "exit_path, channel, ref_host, ref, ip, country, province, city, isp, device, os, browser, active_ms, "
            "actions, visit_no, internal, bot) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (sid, first["vid"], first["src"], first["day"], first["ts"], end_ts, len(rows), first["path"],
             first["title"], last["path"], first["channel"], first["ref_host"], first["ref"], first["ip"],
             first["country"], first["province"], first["city"], first["isp"], first["device"], first["os"],
             first["browser"], sum(r["active_ms"] or 0 for r in rows), ",".join(acts), prev + 1,
             max(r["internal"] or 0 for r in rows), min(r["bot"] or 0 for r in rows)))


def read_new_lines(con, path, key):
    try:
        st = os.stat(path)
    except OSError:
        return []
    ino, off = (get_state(con, key, "0:0").split(":") + ["0"])[:2]
    off = int(off)
    if str(st.st_ino) != ino or st.st_size < off:
        off = 0
    with open(path, "rb") as f:
        f.seek(off)
        data = f.read()
    end = data.rfind(b"\n") + 1
    set_state(con, key, "%s:%d" % (st.st_ino, off + end))
    return data[:end].decode("utf-8", "replace").splitlines()


def ingest_hits(con):
    internal_ips = load_internal_ips()
    geo_cache = {}
    touched = set()
    n_pv = n_ev = 0
    for line in read_new_lines(con, HIT_LOG, "hit_log_pos"):
        try:
            rec = json.loads(line)
        except ValueError:
            continue
        ua = rec.get("ua", "")
        if is_bot(ua):
            continue
        q = {k: v[0] for k, v in parse_qs(rec.get("q", ""), keep_blank_values=False).items()}
        sid, vid, pid = q.get("s"), q.get("v"), q.get("p")
        if not (sid and vid and pid):
            continue
        ts = int(float(rec.get("t") or time.time()))
        day, hour = day_hour(ts)
        ip = rec.get("ip", "")
        internal = 1 if (q.get("x") == "1" or ip in internal_ips) else 0
        e = q.get("e")
        if e == "pv":
            if ip not in geo_cache:
                geo_cache[ip] = geo.lookup(ip)
            g = geo_cache[ip]
            if is_machine(ip, g["isp"]):
                continue
            u = q.get("u", "/")
            parts = urlsplit(u)
            ref = q.get("r", "")
            channel, ref_host = classify(ref, ua, parts.query)
            bot = 0
            if "." in ip and not strong_human(ua, ref):
                prefix = ip.rsplit(".", 1)[0] + "."
                seen = con.execute("SELECT COUNT(DISTINCT ip) FROM pv WHERE ip>=? AND ip<? AND ip<>? AND ts>?",
                                   (prefix, prefix + "~", ip, ts - 30 * 86400)).fetchone()[0]
                bot = 1 if seen >= 9 else 0
            device, os_, browser = parse_ua(ua)
            try:
                seq = int(q.get("n", "1"))
            except ValueError:
                seq = 1
            try:
                sw = int(q.get("sw", "0"))
            except ValueError:
                sw = 0
            insert_pv(con, {
                "ts": ts, "day": day, "hour": hour, "src": "js", "pid": pid, "vid": vid, "sid": sid, "seq": seq,
                "is_new": 1 if q.get("nw") == "1" else 0, "internal": internal, "ip": ip,
                "country": g["country"] or rec.get("cc", ""), "province": g["province"], "city": g["city"],
                "isp": g["isp"], "path": norm_path(parts.path), "query": parts.query[:300],
                "title": q.get("t", "")[:120], "ref": ref[:500], "ref_host": ref_host, "channel": channel,
                "device": device, "os": os_, "browser": browser, "sw": sw, "lang": q.get("lg", "")[:20],
                "ua": ua[:400], "bot": bot})
            n_pv += 1
            touched.add(sid)
        elif e == "lv":
            try:
                a = max(0, min(int(float(q.get("a", "0"))), 6 * 3600 * 1000))
                sd = max(0, min(int(float(q.get("sd", "0"))), 100))
            except ValueError:
                continue
            con.execute("UPDATE pv SET active_ms=MAX(active_ms, ?), scroll=MAX(scroll, ?) WHERE pid=?", (a, sd, pid))
            touched.add(sid)
        elif e == "ck":
            con.execute("INSERT INTO ev (ts, day, vid, sid, pid, internal, kind, target, path) VALUES (?,?,?,?,?,?,?,?,?)",
                        (ts, day, vid, sid, pid, internal, q.get("k", "")[:20], q.get("g", "")[:300],
                         norm_path(q.get("u", ""))[:200]))
            n_ev += 1
            touched.add(sid)
    rebuild_sessions(con, touched)
    return n_pv, n_ev, len(touched)


LOG_LINE = re.compile(
    r'^(?P<ip>\S+) \S+ \S+ \[(?P<time>[^\]]+)\] "(?P<method>[A-Z]+) (?P<url>\S+) [^"]*" (?P<status>\d{3}) \S+ '
    r'"(?P<ref>[^"]*)" "(?P<ua>[^"]*)"')
PAGE_RE = re.compile(r"^/(en/)?(|[a-z0-9-]+\.html|vehicles/[A-Za-z0-9-]+\.html)$")
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.S | re.I)


def page_titles():
    titles = {}
    for sub in ("", "en/", "vehicles/", "en/vehicles/"):
        folder = os.path.join(SITE_ROOT, sub)
        if not os.path.isdir(folder):
            continue
        for name in os.listdir(folder):
            if not name.endswith(".html"):
                continue
            try:
                with open(os.path.join(folder, name), encoding="utf-8", errors="replace") as f:
                    m = TITLE_RE.search(f.read(6000))
            except OSError:
                continue
            if m:
                titles[norm_path("/" + sub + name)] = re.sub(r"\s+", " ", m.group(1)).strip()[:120]
    return titles


ASSET_RE = re.compile(r"\.(css|js)$")


def iter_log(cut):
    """主日志逐行:('page'|'asset', ts, day, hour, vid, ip, parts, ref, ua),只要 GET 200/304、非爬虫,止于 cut。"""
    with open(MAIN_LOG, encoding="utf-8", errors="replace") as f:
        for line in f:
            m = LOG_LINE.match(line)
            if not m or m.group("method") != "GET" or m.group("status") not in ("200", "304"):
                continue
            parts = urlsplit(m.group("url"))
            if PAGE_RE.match(parts.path):
                kind = "page"
            elif ASSET_RE.search(parts.path):
                kind = "asset"
            else:
                continue
            ua = m.group("ua")
            if is_bot(ua):
                continue
            try:
                ts = int(datetime.strptime(m.group("time"), "%d/%b/%Y:%H:%M:%S %z").timestamp())
            except ValueError:
                continue
            if ts >= cut:
                break
            ip = m.group("ip")
            day, hour = day_hour(ts)
            # 7/21 起站点走 Cloudflare 代理,日志里只剩边缘节点 IP:访客只能按 UA+日期估
            if is_cf(ip):
                ip = ""
                vid = "L" + hashlib.md5((ua + day).encode()).hexdigest()[:12]
            else:
                vid = "L" + hashlib.md5((ip + "|" + ua).encode()).hexdigest()[:12]
            yield kind, ts, day, hour, vid, ip, parts, m.group("ref"), ua


def backfill(con):
    """把埋点上线前的主日志页面访问灌进 pv(src='log')。重复跑会先清掉旧的 log 数据。

    真人判定:同一访客的一次访问里,至少有一个页面在打开后 2 分钟内伴随了 css/js 加载。
    伪装成浏览器的扫描器只拉 HTML,不拉样式脚本,这一条能筛掉绝大部分。
    """
    cut = con.execute("SELECT MIN(ts) FROM pv WHERE src='js'").fetchone()[0] or int(time.time())
    internal_ips = load_internal_ips()
    titles = page_titles()
    con.execute("DELETE FROM pv WHERE src='log'")
    con.execute("DELETE FROM sess WHERE src='log'")
    per_day, assets = {}, {}
    for kind, ts, day, _, vid, _, _, _, _ in iter_log(cut):
        if kind == "asset":
            assets.setdefault(vid, []).append(ts)
        else:
            per_day[(vid, day)] = per_day.get((vid, day), 0) + 1
    heavy = {k for k, c in per_day.items() if c > 150}
    per_day = None
    human = set()
    geo_cache = {}
    last_seen, sid_of, seq_of, net24 = {}, {}, {}, {}
    for kind, ts, day, hour, vid, ip, parts, ref, ua in iter_log(cut):
        if kind != "page" or (vid, day) in heavy or ip in internal_ips:
            continue
        if vid not in last_seen or ts - last_seen[vid] > SESSION_GAP:
            sid_of[vid] = "%s-%d" % (vid, ts)
        last_seen[vid] = ts
        times = assets.get(vid)
        if times and sid_of[vid] not in human:
            i = bisect.bisect_left(times, ts - 5)
            if i < len(times) and times[i] <= ts + 120:
                human.add(sid_of[vid])
        seq_of[sid_of[vid]] = seq_of.get(sid_of[vid], 0) + 1
        if ip and ip not in geo_cache:
            geo_cache[ip] = geo.lookup(ip)
        g = geo_cache.get(ip) or {"country": "", "province": "", "city": "", "isp": ""}
        if ip and is_machine(ip, g["isp"]):
            continue
        if ip and "." in ip:
            net24.setdefault(ip.rsplit(".", 1)[0], set()).add(ip)
        path = norm_path(parts.path)
        ref = "" if ref == "-" else ref
        channel, ref_host = classify(ref, ua, parts.query)
        device, os_, browser = parse_ua(ua)
        insert_pv(con, {
            "ts": ts, "day": day, "hour": hour, "src": "log", "pid": None, "vid": vid, "sid": sid_of[vid],
            "seq": seq_of[sid_of[vid]], "is_new": 0, "internal": 0, "ip": ip, "country": g["country"],
            "province": g["province"], "city": g["city"], "isp": g["isp"], "path": path,
            "query": parts.query[:300], "title": titles.get(path, ""), "ref": ref[:500], "ref_host": ref_host,
            "channel": channel, "device": device, "os": os_, "browser": browser, "sw": 0, "lang": "",
            "ua": ua[:400]})
    con.execute("CREATE TEMP TABLE human (sid TEXT PRIMARY KEY)")
    con.executemany("INSERT INTO human VALUES (?)", ((s,) for s in human))
    dropped = con.execute("DELETE FROM pv WHERE src='log' AND sid NOT IN (SELECT sid FROM human)").rowcount
    print("dropped %d page views without css/js evidence" % dropped)
    # 同一个 /24 里冒出 10 个以上不同 IP:机房轮换,不是真人
    farm_nets = sorted(((n, ips) for n, ips in net24.items() if len(ips) >= 10), key=lambda x: -len(x[1]))
    for n24, ips in farm_nets[:int(os.environ.get("STATS_SHOW_FARMS", "0"))]:
        g = geo.lookup(next(iter(ips)))
        print("farm %s.0/24 ips=%d %s %s %s" % (n24, len(ips), g["province"] or g["country"], g["city"], g["isp"]))
    farms = [ip for _, ips in farm_nets for ip in ips]
    con.execute("CREATE TEMP TABLE farm (ip TEXT PRIMARY KEY)")
    con.executemany("INSERT INTO farm VALUES (?)", ((ip,) for ip in farms))
    con.create_function("strong_human", 2, strong_human)
    dropped = con.execute(
        "DELETE FROM pv WHERE src='log' AND ip IN (SELECT ip FROM farm) AND sid NOT IN "
        "(SELECT sid FROM pv WHERE src='log' AND ip IN (SELECT ip FROM farm) AND strong_human(ua, ref)=1)").rowcount
    print("dropped %d page views from %d rotating-IP farm addresses" % (dropped, len(farms)))
    # 同一访客一天拆成 6 次以上访问:监控/轮询程序
    dropped = con.execute(
        "DELETE FROM pv WHERE src='log' AND (vid, day) IN "
        "(SELECT vid, day FROM pv WHERE src='log' GROUP BY vid, day HAVING COUNT(DISTINCT sid) > 6)").rowcount
    print("dropped %d page views from visitors with >6 visits a day" % dropped)
    con.commit()
    sids = [r[0] for r in con.execute("SELECT sid, MIN(ts) m FROM pv WHERE src='log' GROUP BY sid ORDER BY m")]
    rebuild_sessions(con, sids)
    set_state(con, "log_cutover", cut)
    n = con.execute("SELECT COUNT(*) FROM pv WHERE src='log'").fetchone()[0]
    return n, len(sids)


def main():
    con = connect()
    if "--backfill" in sys.argv:
        n, s = backfill(con)
        con.commit()
        print("backfill: %d page views, %d sessions" % (n, s))
        return
    if "--rebuild-sess" in sys.argv:
        con.execute("DELETE FROM sess")
        sids = [r[0] for r in con.execute("SELECT sid, MIN(ts) m FROM pv GROUP BY sid ORDER BY m")]
        rebuild_sessions(con, sids)
        con.commit()
        print("rebuilt %d sessions" % len(sids))
        return
    n_pv, n_ev, n_s = ingest_hits(con)
    set_state(con, "last_ingest", int(time.time()))
    con.commit()
    if n_pv or n_ev:
        print("%s pv=%d ev=%d sessions=%d" % (datetime.now(CST).strftime("%m-%d %H:%M"), n_pv, n_ev, n_s))


if __name__ == "__main__":
    main()
