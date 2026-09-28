#!/usr/bin/env python3
"""把从百度统计「地域分布」按天拉下来的数据导进 stats.db 的 baidu_geo 表。

用途:2026-07-21 ~ 2026-09-27 站点接入 Cloudflare 后服务器丢了真实访客 IP,
这段的省市只能看百度统计(它在访客浏览器里记录,不经过我们服务器)。
只覆盖装了百度统计 hm.js 的页面(首页/关于/选配/新闻/产品分类等),产品中心和车型详情页没有。

    python3 import_baidu.py baidu_geo.json

JSON 结构:{"days": {"2026-07-21": {"prov": [[名称, area, pv, uv, ip], ...],
                                   "cities": {"湖北": [[城市, id, pv, uv, ip], ...]},
                                   "country": [[国家, area, pv, uv, ip], ...]}}}
重复导入同一天会先删后插。
"""
import json
import sqlite3
import sys

from ingest import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS baidu_geo (
    day TEXT NOT NULL, level TEXT NOT NULL, province TEXT, city TEXT, country TEXT,
    pv INTEGER, uv INTEGER, ip INTEGER);
CREATE INDEX IF NOT EXISTS baidu_geo_day ON baidu_geo(day, level);
"""


def main(path):
    days = json.load(open(path, encoding="utf-8"))["days"]
    con = sqlite3.connect(DB_PATH, timeout=30)
    con.executescript(SCHEMA)
    n = 0
    for day, rec in sorted(days.items()):
        con.execute("DELETE FROM baidu_geo WHERE day=?", (day,))
        rows = []
        for name, _, pv, uv, ip in rec.get("prov") or []:
            rows.append((day, "province", name, "", "", pv, uv, ip))
        for prov, cities in (rec.get("cities") or {}).items():
            for name, _, pv, uv, ip in cities:
                rows.append((day, "city", prov, name, "", pv, uv, ip))
        for name, _, pv, uv, ip in rec.get("country") or []:
            rows.append((day, "country", "", "", name, pv, uv, ip))
        con.executemany("INSERT INTO baidu_geo VALUES (?,?,?,?,?,?,?,?)",
                        [tuple(0 if v in ("--", None) else v for v in r) for r in rows])
        n += len(rows)
    con.commit()
    print("imported %d rows for %d days" % (n, len(days)))


if __name__ == "__main__":
    main(sys.argv[1])
