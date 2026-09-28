"""官网访问统计 API(读 /opt/site-stats/stats.db,由 site-stats/ingest.py 每分钟写入)。"""
from __future__ import annotations

import json
import os
import sqlite3
from datetime import date, datetime, timedelta

from flask import Blueprint, jsonify, request

import auth

bp = Blueprint("stats", __name__)

DB_PATH = os.getenv("STATS_DB", "/opt/site-stats/stats.db")
INQUIRY_LOG = os.getenv("INQUIRY_LOG", "/var/log/inquiries.jsonl")

RANGES = {"today": 0, "yesterday": 1, "7d": 6, "30d": 29, "90d": 89}
# 站点接入 Cloudflare 后、Nginx 还原真实 IP 之前:服务器没有访客地区,这段用百度统计补(baidu_geo 表)
GEO_GAP = ("2026-07-21", "2026-09-27")


def _db() -> sqlite3.Connection:
    con = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True, timeout=10)
    con.row_factory = sqlite3.Row
    return con


def _range() -> tuple[str, str, str]:
    key = request.args.get("range", "7d")
    today = date.today()
    if key == "custom":
        start = request.args.get("from", "")
        end = request.args.get("to", "")
        datetime.strptime(start, "%Y-%m-%d")
        datetime.strptime(end, "%Y-%m-%d")
        return start, end, key
    if key == "all":
        return "2000-01-01", today.isoformat(), key
    if key == "yesterday":
        d = (today - timedelta(days=1)).isoformat()
        return d, d, key
    days = RANGES.get(key, 6)
    return (today - timedelta(days=days)).isoformat(), today.isoformat(), key


def _where(alias: str = "") -> str:
    p = alias + "." if alias else ""
    cond = f"{p}day BETWEEN ? AND ? AND {p}bot=0"
    if request.args.get("internal") != "1":
        cond += f" AND {p}internal=0"
    return cond


def _kpi(con: sqlite3.Connection, start: str, end: str) -> dict:
    w = _where()
    pv, uv = con.execute(f"SELECT COUNT(*), COUNT(DISTINCT vid) FROM pv WHERE {w}", (start, end)).fetchone()
    s = con.execute(
        f"SELECT COUNT(*), SUM(pages=1), SUM(visit_no>1), SUM(actions<>''), "
        f"AVG(CASE WHEN src='js' AND active_ms>0 THEN active_ms END), SUM(src='js') FROM sess WHERE {w}",
        (start, end)).fetchone()
    returning = con.execute(f"SELECT COUNT(DISTINCT vid) FROM sess WHERE {w} AND visit_no>1", (start, end)).fetchone()[0]
    sessions = s[0] or 0
    return {
        "pv": pv, "uv": uv, "sessions": sessions,
        "bounce_rate": round((s[1] or 0) / sessions, 3) if sessions else None,
        "returning_visitors": returning,
        "returning_rate": round(returning / uv, 3) if uv else None,
        "action_sessions": s[3] or 0,
        "avg_active_s": round((s[4] or 0) / 1000) if s[4] else None,
        "js_sessions": s[5] or 0,
        "pages_per_session": round(pv / sessions, 2) if sessions else None,
    }


def _inquiries(start: str, end: str) -> list[dict]:
    out = []
    try:
        with open(INQUIRY_LOG, encoding="utf-8") as f:
            for line in f:
                try:
                    r = json.loads(line)
                except ValueError:
                    continue
                d = str(r.get("ts", ""))[:10]
                if start <= d <= end:
                    out.append({"ts": r.get("ts"), "location": r.get("location", ""), "ip": r.get("ip", "")})
    except OSError:
        pass
    return out


def _rows(cur) -> list[dict]:
    return [dict(r) for r in cur.fetchall()]


def _baidu_geo(con: sqlite3.Connection, start: str, end: str) -> dict | None:
    lo, hi = max(start, GEO_GAP[0]), min(end, GEO_GAP[1])
    if lo > hi:
        return None
    args = (lo, hi)
    try:
        provinces = _rows(con.execute(
            "SELECT province AS name, SUM(uv) visitors, SUM(pv) pv FROM baidu_geo WHERE level='province' "
            "AND day BETWEEN ? AND ? AND province NOT IN ('其他', '') GROUP BY province ORDER BY visitors DESC LIMIT 15", args))
    except sqlite3.OperationalError:
        return None
    cities = _rows(con.execute(
        "SELECT province, city AS name, SUM(uv) visitors FROM baidu_geo WHERE level='city' AND day BETWEEN ? AND ? "
        "AND city NOT IN ('其他', '') GROUP BY province, city ORDER BY visitors DESC LIMIT 12", args))
    countries = _rows(con.execute(
        "SELECT country AS name, SUM(uv) visitors FROM baidu_geo WHERE level='country' AND day BETWEEN ? AND ? "
        "AND country NOT IN ('中国', '其他', '') GROUP BY country ORDER BY visitors DESC LIMIT 8", args))
    total, unknown = con.execute(
        "SELECT SUM(uv), SUM(CASE WHEN province='其他' THEN uv ELSE 0 END) FROM baidu_geo "
        "WHERE level='province' AND day BETWEEN ? AND ?", args).fetchone()
    days = con.execute("SELECT COUNT(DISTINCT day) FROM baidu_geo WHERE day BETWEEN ? AND ?", args).fetchone()[0]
    return {"from": lo, "to": hi, "days": days, "provinces": provinces, "cities": cities, "countries": countries,
            "total": total or 0, "unknown": unknown or 0}


@bp.route("/api/stats/overview")
def overview():
    auth.require_user()
    start, end, key = _range()
    if not os.path.exists(DB_PATH):
        return jsonify({"error": "no-data"}), 503
    con = _db()
    w = _where()
    args = (start, end)
    first_day = con.execute("SELECT MIN(day) FROM pv").fetchone()[0]
    if key == "all" and first_day:
        start = first_day
        args = (start, end)
    kpi = _kpi(con, start, end)
    prev = None
    if key != "all":
        d0, d1 = date.fromisoformat(start), date.fromisoformat(end)
        span = (d1 - d0).days + 1
        prev = _kpi(con, (d0 - timedelta(days=span)).isoformat(), (d0 - timedelta(days=1)).isoformat())

    by_hour = start == end
    if by_hour:
        trend = _rows(con.execute(
            f"SELECT hour AS t, COUNT(*) pv, COUNT(DISTINCT vid) uv, COUNT(DISTINCT sid) sessions "
            f"FROM pv WHERE {w} GROUP BY hour ORDER BY hour", args))
    else:
        trend = _rows(con.execute(
            f"SELECT day AS t, COUNT(*) pv, COUNT(DISTINCT vid) uv, COUNT(DISTINCT sid) sessions "
            f"FROM pv WHERE {w} GROUP BY day ORDER BY day", args))

    channels = _rows(con.execute(
        f"SELECT channel AS name, COUNT(*) sessions, COUNT(DISTINCT vid) visitors, SUM(actions<>'') acted "
        f"FROM sess WHERE {w} GROUP BY channel ORDER BY sessions DESC", args))
    referrers = _rows(con.execute(
        f"SELECT ref_host AS name, channel, COUNT(*) sessions FROM sess WHERE {w} AND ref_host<>'' "
        f"AND channel NOT IN ('站内') GROUP BY ref_host ORDER BY sessions DESC LIMIT 15", args))
    regions = _rows(con.execute(
        f"SELECT CASE WHEN country IN ('中国','') THEN province ELSE country END AS name, "
        f"COUNT(*) sessions, COUNT(DISTINCT vid) visitors FROM sess WHERE {w} AND ip<>'' AND "
        f"(province<>'' OR country NOT IN ('中国','')) GROUP BY name ORDER BY sessions DESC LIMIT 15", args))
    cities = _rows(con.execute(
        f"SELECT province, city AS name, COUNT(*) sessions FROM sess WHERE {w} AND city<>'' "
        f"GROUP BY province, city ORDER BY sessions DESC LIMIT 15", args))
    unknown_geo = con.execute(f"SELECT COUNT(*) FROM sess WHERE {w} AND ip=''", args).fetchone()[0]
    baidu = _baidu_geo(con, start, end)
    pages = _rows(con.execute(
        f"SELECT path, MAX(title) title, COUNT(*) pv, COUNT(DISTINCT vid) uv, "
        f"ROUND(AVG(CASE WHEN src='js' AND active_ms>0 THEN active_ms END)/1000.0) avg_active_s, "
        f"SUM(seq=1) entries FROM pv WHERE {w} GROUP BY path ORDER BY pv DESC LIMIT 25", args))
    devices = _rows(con.execute(
        f"SELECT device AS name, COUNT(*) sessions FROM sess WHERE {w} GROUP BY device ORDER BY sessions DESC", args))
    systems = _rows(con.execute(
        f"SELECT os AS name, COUNT(*) sessions FROM sess WHERE {w} GROUP BY os ORDER BY sessions DESC LIMIT 8", args))
    browsers = _rows(con.execute(
        f"SELECT browser AS name, COUNT(*) sessions FROM sess WHERE {w} GROUP BY browser "
        f"ORDER BY sessions DESC LIMIT 10", args))
    hours = _rows(con.execute(
        f"SELECT CAST(strftime('%H', start_ts, 'unixepoch', '+8 hours') AS INTEGER) AS h, COUNT(*) sessions "
        f"FROM sess WHERE {w} GROUP BY h ORDER BY h", args))
    ev_where = "day BETWEEN ? AND ?" + ("" if request.args.get("internal") == "1" else " AND internal=0")
    actions = _rows(con.execute(
        f"SELECT kind, COUNT(*) clicks, COUNT(DISTINCT sid) sessions FROM ev WHERE {ev_where} "
        f"GROUP BY kind ORDER BY clicks DESC", args))
    state = {r["k"]: r["v"] for r in con.execute("SELECT k, v FROM state")}
    js_since = con.execute("SELECT MIN(day) FROM pv WHERE src='js'").fetchone()[0]
    con.close()
    return jsonify({
        "range": {"key": key, "from": start, "to": end, "by_hour": by_hour},
        "meta": {
            "js_since": js_since, "first_day": first_day,
            "log_cutover": int(state["log_cutover"]) if state.get("log_cutover") else None,
            "last_ingest": int(state["last_ingest"]) if state.get("last_ingest") else None,
        },
        "kpi": kpi, "kpi_prev": prev, "trend": trend, "channels": channels, "referrers": referrers,
        "regions": regions, "cities": cities, "unknown_geo_sessions": unknown_geo, "baidu_geo": baidu, "pages": pages,
        "devices": devices, "systems": systems, "browsers": browsers, "hours": hours, "actions": actions,
        "inquiries": _inquiries(start, end),
    })


@bp.route("/api/stats/sessions")
def sessions():
    auth.require_user()
    start, end, _ = _range()
    if not os.path.exists(DB_PATH):
        return jsonify({"total": 0, "items": []})
    page = max(1, int(request.args.get("page", "1") or 1))
    size = min(100, max(10, int(request.args.get("size", "30") or 30)))
    w = _where()
    args: list = [start, end]
    channel = request.args.get("channel", "").strip()
    if channel:
        w += " AND channel=?"
        args.append(channel)
    device = request.args.get("device", "").strip()
    if device:
        w += " AND device=?"
        args.append(device)
    if request.args.get("acted") == "1":
        w += " AND actions<>''"
    if request.args.get("multi") == "1":
        w += " AND pages>1"
    q = request.args.get("q", "").strip()
    if q:
        like = f"%{q}%"
        w += (" AND (ip LIKE ? OR province LIKE ? OR city LIKE ? OR isp LIKE ? OR landing LIKE ? "
              "OR landing_title LIKE ? OR ref_host LIKE ? OR sid IN (SELECT sid FROM pv WHERE path LIKE ? OR title LIKE ?))")
        args += [like] * 9
    con = _db()
    total = con.execute(f"SELECT COUNT(*) FROM sess WHERE {w}", args).fetchone()[0]
    items = _rows(con.execute(
        f"SELECT sid, vid, src, start_ts, end_ts, pages, landing, landing_title, exit_path, channel, ref_host, ref, "
        f"ip, country, province, city, isp, device, os, browser, active_ms, actions, visit_no, internal "
        f"FROM sess WHERE {w} ORDER BY start_ts DESC LIMIT ? OFFSET ?", args + [size, (page - 1) * size]))
    con.close()
    return jsonify({"total": total, "page": page, "size": size, "items": items})


@bp.route("/api/stats/session/<sid>")
def session_detail(sid: str):
    auth.require_user()
    con = _db()
    pages = _rows(con.execute(
        "SELECT ts, path, query, title, active_ms, scroll, ref, seq FROM pv WHERE sid=? ORDER BY ts, seq", (sid,)))
    events = _rows(con.execute("SELECT ts, kind, target, path FROM ev WHERE sid=? ORDER BY ts", (sid,)))
    head = con.execute("SELECT ua, sw, lang FROM pv WHERE sid=? ORDER BY ts LIMIT 1", (sid,)).fetchone()
    vid_row = con.execute("SELECT vid FROM sess WHERE sid=?", (sid,)).fetchone()
    history = []
    if vid_row:
        history = _rows(con.execute(
            "SELECT sid, start_ts, pages, channel, landing_title, landing FROM sess WHERE vid=? AND sid<>? "
            "ORDER BY start_ts DESC LIMIT 10", (vid_row["vid"], sid)))
    con.close()
    return jsonify({"pages": pages, "events": events, "ua": head["ua"] if head else "",
                    "screen": head["sw"] if head else None, "lang": head["lang"] if head else "",
                    "history": history})
