/* 访客统计页。数据: /api/stats/overview · /api/stats/sessions · /api/stats/session/<sid> */
(function () {
    'use strict';
    if (!document.getElementById('traffic-page')) return;

    var state = { range: '7d', internal: false, metric: 'uv', page: 1, data: null, timer: null };
    var ACT = { tel: '拨打电话', douyin: '打开抖音', whatsapp: '点 WhatsApp', mail: '发邮件', out: '点外部链接', form: '提交表单', track: '其他点击' };
    var METRIC = { uv: '访客', pv: '浏览量', sessions: '访问次数' };
    var el = function (id) { return document.getElementById(id); };

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function num(n) {
        if (n == null) return '—';
        if (n >= 100000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
        return Number(n).toLocaleString('zh-CN');
    }
    function dur(s) {
        if (s == null) return '—';
        s = Math.round(s);
        if (s < 60) return s + ' 秒';
        if (s < 3600) return Math.floor(s / 60) + ' 分' + (s % 60 ? ' ' + (s % 60) + ' 秒' : '');
        return Math.floor(s / 3600) + ' 小时 ' + Math.floor((s % 3600) / 60) + ' 分';
    }
    var fmtParts = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    function when(ts) {
        var p = {};
        fmtParts.formatToParts(new Date(ts * 1000)).forEach(function (x) { p[x.type] = x.value; });
        return p.month + '-' + p.day + ' ' + p.hour + ':' + p.minute;
    }
    function mmdd(day) { return day.slice(5).replace('-', '/'); }
    function pageName(title, path) {
        if (path === '/') return '首页';
        if (path === '/en/') return '英文首页';
        var t = String(title || '').split(/\s*[|｜]\s*|\s+[-–—]\s+/)[0].trim();
        return t || path;
    }
    function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }

    // ---------- 数据 ----------
    function query(extra) {
        var q = 'range=' + state.range + (state.internal ? '&internal=1' : '');
        return extra ? q + '&' + extra : q;
    }
    function load(silent) {
        var main = el('traffic-page');
        if (!silent) main.style.opacity = '0.55';
        return api('/stats/overview?' + query()).then(function (d) {
            state.data = d;
            render(d);
            return loadStream();
        }).catch(function (err) {
            if (String(err.message).indexOf('unauthorized') >= 0) return;
            el('tr-note').hidden = false;
            el('tr-note').textContent = err.message === 'no-data' ? '统计数据还没生成,稍等一分钟再刷新。' : '读取失败:' + err.message;
        }).then(function () { main.style.opacity = ''; });
    }
    function loadStream() {
        var f = [];
        f.push('page=' + state.page, 'size=30');
        var q = el('tr-q').value.trim();
        if (q) f.push('q=' + encodeURIComponent(q));
        if (el('tr-channel').value) f.push('channel=' + encodeURIComponent(el('tr-channel').value));
        if (el('tr-device').value) f.push('device=' + encodeURIComponent(el('tr-device').value));
        if (el('tr-acted').checked) f.push('acted=1');
        if (el('tr-multi').checked) f.push('multi=1');
        return api('/stats/sessions?' + query(f.join('&'))).then(renderStream);
    }

    // ---------- 渲染 ----------
    function render(d) {
        var m = d.meta, r = d.range;
        var upd = m.last_ingest ? '数据更新于 ' + when(m.last_ingest).slice(6) : '';
        el('tr-updated').textContent = upd + (r.key === 'today' ? ' · 每分钟自动刷新' : '');
        renderNote(d);
        renderKpis(d.kpi, d.kpi_prev);
        renderTrend(d);
        var total = d.kpi.sessions;
        bars(el('tr-channels'), d.channels.map(function (x) { return { name: x.name, value: x.sessions }; }), total);
        renderRegions(d, total);
        renderPages(d.pages);
        bars(el('tr-referrers'), d.referrers.map(function (x) { return { name: x.name, value: x.sessions }; }), total);
        renderHours(d.hours);
        bars(el('tr-devices'), d.devices.map(function (x) { return { name: x.name, value: x.sessions }; }), total, true);
        bars(el('tr-systems'), d.systems.map(function (x) { return { name: x.name, value: x.sessions }; }), total, true);
        bars(el('tr-browsers'), d.browsers.map(function (x) { return { name: x.name, value: x.sessions }; }), total, true);
        renderActions(d);
        var sel = el('tr-channel'), cur = sel.value;
        sel.innerHTML = '<option value="">全部渠道</option>' + d.channels.map(function (x) {
            return '<option' + (x.name === cur ? ' selected' : '') + '>' + esc(x.name) + '</option>';
        }).join('');
    }

    function renderNote(d) {
        var m = d.meta, r = d.range, parts = [];
        var jsDay = m.js_since;
        if (!jsDay || r.from < jsDay) {
            parts.push('<b>' + (jsDay ? mmdd(jsDay) + ' 之前' : '目前') + '的数据是从服务器日志里估算的</b>:已尽量筛掉爬虫和扫描器,访客数只作参考;停留时长和按钮点击' + (jsDay ? '从 ' + mmdd(jsDay) + ' 起' : '等统计脚本上线后') + '才有。');
        }
        if (!state.internal) parts.push('自己人的设备在浏览器里打开一次 hboyjd.com/?internal=1 ,以后就不算进访客。');
        el('tr-note').hidden = !parts.length;
        el('tr-note').innerHTML = parts.join('<br>');
    }

    function renderKpis(k, p) {
        function delta(cur, prev, upGood, isRate) {
            if (!p || prev == null || cur == null) return '';
            if (isRate) {
                var dp = Math.round((cur - prev) * 100);
                if (!dp) return '<div class="delta">和上一周期持平</div>';
                var good = upGood ? dp > 0 : dp < 0;
                return '<div class="delta ' + (good ? 'good' : 'bad') + '">比上一周期 ' + (dp > 0 ? '+' : '') + dp + ' 个百分点</div>';
            }
            if (!prev) return cur ? '<div class="delta">上一周期为 0</div>' : '';
            var d = Math.round((cur - prev) / prev * 100);
            if (!d) return '<div class="delta">和上一周期持平</div>';
            return '<div class="delta ' + ((upGood ? d > 0 : d < 0) ? 'good' : 'bad') + '">比上一周期 ' + (d > 0 ? '+' : '') + d + '%</div>';
        }
        var tiles = [
            ['访客', num(k.uv), delta(k.uv, p && p.uv, true), '不同的人(按设备算)'],
            ['浏览量', num(k.pv), delta(k.pv, p && p.pv, true), '一共打开了多少个页面'],
            ['访问次数', num(k.sessions), delta(k.sessions, p && p.sessions, true), '间隔 30 分钟算新的一次'],
            ['平均停留', k.avg_active_s == null ? '—' : dur(k.avg_active_s), '', k.js_sessions ? '按精确统计的 ' + num(k.js_sessions) + ' 次访问' : '统计脚本上线后才有'],
            ['跳出率', k.bounce_rate == null ? '—' : Math.round(k.bounce_rate * 100) + '<small>%</small>', delta(k.bounce_rate, p && p.bounce_rate, false, true), '只看了一页就走'],
            ['回头客', num(k.returning_visitors), '', k.uv ? '占访客 ' + pct(k.returning_visitors, k.uv) + '% · 来过不止一次' : '来过不止一次'],
        ];
        el('tr-kpis').innerHTML = tiles.map(function (t) {
            return '<div class="tr-kpi"><div class="lbl">' + t[0] + '</div><div class="val">' + t[1] + '</div>' + t[2] + '<div class="hint">' + t[3] + '</div></div>';
        }).join('');
    }

    function fillDays(from, to, rows) {
        var map = {}, out = [];
        rows.forEach(function (x) { map[x.t] = x; });
        var d = new Date(from + 'T00:00:00Z'), end = new Date(to + 'T00:00:00Z');
        while (d <= end) {
            var key = d.toISOString().slice(0, 10);
            out.push(map[key] || { t: key, pv: 0, uv: 0, sessions: 0 });
            d.setUTCDate(d.getUTCDate() + 1);
        }
        return out;
    }

    function renderTrend(d) {
        var r = d.range, rows;
        if (r.by_hour) {
            var map = {};
            d.trend.forEach(function (x) { map[x.t] = x; });
            rows = [];
            for (var h = 0; h < 24; h++) rows.push(map[h] || { t: h, pv: 0, uv: 0, sessions: 0 });
        } else {
            rows = fillDays(r.from, r.to, d.trend);
        }
        var key = state.metric;
        var pts = rows.map(function (x) {
            var label = r.by_hour ? x.t + '点' : mmdd(x.t);
            return {
                label: label, value: x[key],
                tip: '<b>' + (r.by_hour ? x.t + ':00 - ' + x.t + ':59' : x.t) + '</b>访客 ' + num(x.uv) + '<br>浏览量 ' + num(x.pv) + '<br>访问次数 ' + num(x.sessions),
                day: x.t
            };
        });
        var marker = -1;
        if (!r.by_hour && d.meta.js_since && d.meta.js_since > r.from) {
            pts.forEach(function (p, i) { if (p.day === d.meta.js_since) marker = i; });
        }
        var opts = { height: 230, marker: marker, markerLabel: '精确统计开始', name: METRIC[key] };
        if (pts.length > 45) lineChart(el('tr-trend'), pts, opts);
        else columnChart(el('tr-trend'), pts, opts);
        el('tr-trend-table').innerHTML = '<table class="tr-table"><thead><tr><th>' + (r.by_hour ? '时段' : '日期') + '</th><th class="n">访客</th><th class="n">浏览量</th><th class="n">访问次数</th></tr></thead><tbody>' +
            rows.slice().reverse().map(function (x) {
                return '<tr><td>' + esc(r.by_hour ? x.t + ':00' : x.t) + '</td><td class="n">' + num(x.uv) + '</td><td class="n">' + num(x.pv) + '</td><td class="n">' + num(x.sessions) + '</td></tr>';
            }).join('') + '</tbody></table>';
    }

    function renderHours(hours) {
        var map = {};
        hours.forEach(function (x) { map[x.h] = x.sessions; });
        var pts = [];
        for (var h = 0; h < 24; h++) pts.push({ label: String(h), value: map[h] || 0, tip: '<b>' + h + ':00 - ' + h + ':59</b>访问 ' + num(map[h] || 0) + ' 次' });
        columnChart(el('tr-hours'), pts, { height: 170, marker: -1, name: '访问次数', everyLabel: 3 });
    }

    function bars(box, rows, total, compact) {
        if (!rows.length) { box.innerHTML = '<div class="tr-empty">这段时间没有数据</div>'; return; }
        var max = Math.max.apply(null, rows.map(function (x) { return x.value; })) || 1;
        box.innerHTML = rows.map(function (x) {
            var share = total ? pct(x.value, total) : 0;
            return '<div class="tr-bar-row" title="' + esc(x.name) + ' · ' + num(x.value) + '"><div class="nm">' + esc(x.name || '未知') + '</div>' +
                '<div class="track"><div class="fill" style="width:' + (x.value / max * 100).toFixed(1) + '%"></div></div>' +
                '<div class="num">' + num(x.value) + (compact ? '' : '<span>' + share + '%</span>') + '</div></div>';
        }).join('');
    }

    function renderRegions(d, total) {
        var foot = el('tr-regions-foot');
        if (!d.regions.length && d.unknown_geo_sessions > 0) {
            el('tr-regions').innerHTML = '<div class="tr-geo-gap"><b>这段时间的 ' + num(d.unknown_geo_sessions) + ' 次访问看不到地区</b>' +
                '7 月 21 日网站接入 Cloudflare 加速后,服务器只记下了 Cloudflare 节点的地址,真实访客 IP 丢了,这段补不回来。' +
                '9 月 28 日已修好,之后的新访问都能看到省市和运营商。' +
                '<button type="button" class="btn btn-outline btn-mini" data-range-jump="all">看 7 月 21 日以前的地区分布</button></div>';
            foot.textContent = '';
            return;
        }
        bars(el('tr-regions'), d.regions.map(function (x) { return { name: x.name, value: x.sessions }; }), total);
        foot.textContent = d.unknown_geo_sessions > 0
            ? '另有 ' + num(d.unknown_geo_sessions) + ' 次访问看不到地区:7 月 21 日到 9 月 28 日之间服务器只记下了 Cloudflare 节点地址,这段补不回来。'
            : '';
    }

    function renderPages(pages) {
        var btn = el('tr-pages-more');
        btn.hidden = pages.length <= 10;
        btn.textContent = state.allPages ? '只看前 10 个' : '展开全部 ' + pages.length + ' 个页面';
        if (!pages.length) { el('tr-pages').innerHTML = '<tr><td class="tr-empty">这段时间没有数据</td></tr>'; return; }
        if (!state.allPages) pages = pages.slice(0, 10);
        el('tr-pages').innerHTML = '<thead><tr><th>页面</th><th class="n">浏览量</th><th class="n">访客</th><th class="n">作为入口</th><th class="n">平均停留</th></tr></thead><tbody>' +
            pages.map(function (x) {
                return '<tr><td>' + esc(pageName(x.title, x.path)) + '<div class="path">' + esc(x.path) + '</div></td><td class="n">' + num(x.pv) + '</td><td class="n">' + num(x.uv) +
                    '</td><td class="n">' + num(x.entries) + '</td><td class="n">' + (x.avg_active_s == null ? '—' : dur(x.avg_active_s)) + '</td></tr>';
            }).join('') + '</tbody>';
    }

    function renderActions(d) {
        var seen = {};
        d.actions.forEach(function (a) { seen[a.kind] = a; });
        var kinds = ['tel', 'douyin', 'whatsapp', 'form', 'mail', 'out'];
        d.actions.forEach(function (a) { if (kinds.indexOf(a.kind) < 0) kinds.push(a.kind); });
        var tiles = kinds.map(function (k) {
            var a = seen[k] || { clicks: 0, sessions: 0 };
            return '<div class="tr-act"><div class="v">' + num(a.clicks) + '</div><div class="l">' + esc(ACT[k] || k) + (a.sessions ? ' · ' + num(a.sessions) + ' 次访问里' : '') + '</div></div>';
        });
        tiles.push('<div class="tr-act"><div class="v">' + num(d.inquiries.length) + '</div><div class="l">官网询价表单收到</div></div>');
        el('tr-actions').innerHTML = tiles.join('');
        el('tr-actions-foot').textContent = d.meta.js_since
            ? '电话、抖音、外链等点击从 ' + mmdd(d.meta.js_since) + ' 起记录。询价表单数来自服务器询价记录。'
            : '电话、抖音、外链等点击从统计脚本上线后开始记录。询价表单数来自服务器询价记录。';
    }

    // ---------- 图 ----------
    function niceScale(v) {
        var raw = Math.max(v, 1) / 4;
        var p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
        var step = Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p);
        var ticks = Math.max(1, Math.ceil(Math.max(v, 1) / step));
        return { max: step * ticks, ticks: ticks };
    }
    function frame(box, opts) {
        var W = Math.max(280, box.clientWidth), H = opts.height;
        var m = { l: 40, r: 12, t: 18, b: 26 };
        return { W: W, H: H, m: m, pw: W - m.l - m.r, ph: H - m.t - m.b };
    }
    function yAxis(f, sc) {
        var s = '';
        for (var i = 0; i <= sc.ticks; i++) {
            var v = sc.max / sc.ticks * i, y = f.m.t + f.ph - f.ph * i / sc.ticks;
            s += '<line class="grid" x1="' + f.m.l + '" x2="' + (f.W - f.m.r) + '" y1="' + y + '" y2="' + y + '"/>';
            s += '<text class="axis" x="' + (f.m.l - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + num(Math.round(v)) + '</text>';
        }
        return s;
    }
    function xLabels(f, pts, xAt, every) {
        var step = every || Math.max(1, Math.ceil(pts.length / Math.max(1, Math.floor(f.pw / 52))));
        var s = '';
        pts.forEach(function (p, i) {
            if (i % step && i !== pts.length - 1) return;
            if (i === pts.length - 1 && i % step && (i % step) < step / 2) return;
            s += '<text class="axis" x="' + xAt(i) + '" y="' + (f.H - 6) + '" text-anchor="middle">' + esc(p.label) + '</text>';
        });
        return s;
    }
    function markerSvg(f, x, label) {
        var right = x > f.m.l + f.pw * 0.7;
        return '<line class="mark-line" x1="' + x + '" x2="' + x + '" y1="' + (f.m.t - 6) + '" y2="' + (f.m.t + f.ph) + '"/>' +
            '<text class="mark-text" x="' + (right ? x - 6 : x + 6) + '" y="' + (f.m.t + 4) + '" text-anchor="' + (right ? 'end' : 'start') + '">' +
            esc(label) + ' →</text>';
    }
    function tipAt(box, html, x, y) {
        var tip = box.querySelector('.tr-tip');
        if (!tip) { tip = document.createElement('div'); tip.className = 'tr-tip'; box.appendChild(tip); }
        tip.innerHTML = html;
        tip.hidden = false;
        var w = tip.offsetWidth, bw = box.clientWidth;
        var left = Math.min(Math.max(0, x - w / 2), bw - w);
        tip.style.left = left + 'px';
        tip.style.top = Math.max(0, y - tip.offsetHeight - 10) + 'px';
    }
    function hideTip(box) { var t = box.querySelector('.tr-tip'); if (t) t.hidden = true; }

    function columnChart(box, pts, opts) {
        var f = frame(box, opts);
        var sc = niceScale(Math.max.apply(null, pts.map(function (p) { return p.value; })) || 0), max = sc.max;
        var band = f.pw / pts.length, bw = Math.max(2, Math.min(24, band * 0.62));
        var xAt = function (i) { return f.m.l + band * i + band / 2; };
        var peak = -1, pv = 0;
        pts.forEach(function (p, i) { if (p.value > pv) { pv = p.value; peak = i; } });
        var s = yAxis(f, sc);
        pts.forEach(function (p, i) {
            var h = p.value / max * f.ph, x = xAt(i) - bw / 2, y0 = f.m.t + f.ph;
            if (h > 0) {
                var r = Math.min(4, bw / 2, h);
                s += '<path class="bar" data-i="' + i + '" d="M' + x + ',' + y0 + 'V' + (y0 - h + r) + 'Q' + x + ',' + (y0 - h) + ' ' + (x + r) + ',' + (y0 - h) +
                    'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + (y0 - h) + ' ' + (x + bw) + ',' + (y0 - h + r) + 'V' + y0 + 'Z"/>';
            }
        });
        if (peak >= 0 && pv > 0) s += '<text class="peak" x="' + xAt(peak) + '" y="' + (f.m.t + f.ph - pv / max * f.ph - 6) + '" text-anchor="middle">' + num(pv) + '</text>';
        if (opts.marker >= 0) s += markerSvg(f, f.m.l + band * opts.marker, opts.markerLabel);
        s += xLabels(f, pts, xAt, opts.everyLabel);
        pts.forEach(function (p, i) {
            s += '<rect data-hit="' + i + '" x="' + (f.m.l + band * i) + '" y="' + f.m.t + '" width="' + band + '" height="' + f.ph + '" fill="transparent"/>';
        });
        box.innerHTML = '<svg viewBox="0 0 ' + f.W + ' ' + f.H + '" height="' + f.H + '" role="img" aria-label="' + esc(opts.name) + '柱状图">' + s + '</svg>';
        var svg = box.querySelector('svg');
        svg.addEventListener('mousemove', function (e) {
            var t = e.target.getAttribute('data-hit');
            svg.querySelectorAll('.bar.hot').forEach(function (b) { b.classList.remove('hot'); });
            if (t == null) { hideTip(box); return; }
            var i = +t, bar = svg.querySelector('.bar[data-i="' + i + '"]');
            if (bar) bar.classList.add('hot');
            var scale = box.clientWidth / f.W;
            tipAt(box, pts[i].tip, xAt(i) * scale, (f.m.t + f.ph - pts[i].value / max * f.ph) * scale);
        });
        svg.addEventListener('mouseleave', function () {
            hideTip(box);
            svg.querySelectorAll('.bar.hot').forEach(function (b) { b.classList.remove('hot'); });
        });
    }

    function lineChart(box, pts, opts) {
        var f = frame(box, opts);
        var sc = niceScale(Math.max.apply(null, pts.map(function (p) { return p.value; })) || 0), max = sc.max;
        var step = f.pw / Math.max(1, pts.length - 1);
        var xAt = function (i) { return f.m.l + step * i; };
        var yAt = function (v) { return f.m.t + f.ph - v / max * f.ph; };
        var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + xAt(i).toFixed(1) + ',' + yAt(p.value).toFixed(1); }).join('');
        var area = line + 'L' + xAt(pts.length - 1) + ',' + (f.m.t + f.ph) + 'L' + xAt(0) + ',' + (f.m.t + f.ph) + 'Z';
        var peak = 0;
        pts.forEach(function (p, i) { if (p.value > pts[peak].value) peak = i; });
        var s = yAxis(f, sc);
        s += '<path d="' + area + '" fill="var(--blue-500)" fill-opacity="0.1"/>';
        s += '<path d="' + line + '" fill="none" stroke="var(--blue-500)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
        if (pts[peak].value > 0) s += '<text class="peak" x="' + xAt(peak) + '" y="' + (yAt(pts[peak].value) - 8) + '" text-anchor="middle">' + num(pts[peak].value) + '</text>';
        if (opts.marker >= 0) s += markerSvg(f, xAt(opts.marker), opts.markerLabel);
        s += xLabels(f, pts, xAt);
        s += '<line class="cross" x1="0" x2="0" y1="' + f.m.t + '" y2="' + (f.m.t + f.ph) + '" stroke="var(--gray-500)" stroke-width="1" visibility="hidden"/>';
        s += '<circle class="dot" r="4" fill="var(--blue-500)" stroke="white" stroke-width="2" visibility="hidden"/>';
        s += '<rect class="hit" x="' + f.m.l + '" y="' + f.m.t + '" width="' + f.pw + '" height="' + f.ph + '" fill="transparent"/>';
        box.innerHTML = '<svg viewBox="0 0 ' + f.W + ' ' + f.H + '" height="' + f.H + '" role="img" aria-label="' + esc(opts.name) + '折线图">' + s + '</svg>';
        var svg = box.querySelector('svg'), cross = svg.querySelector('.cross'), dot = svg.querySelector('.dot');
        svg.addEventListener('mousemove', function (e) {
            var rect = svg.getBoundingClientRect(), scale = rect.width / f.W;
            var x = (e.clientX - rect.left) / scale;
            if (x < f.m.l - step / 2 || x > f.W - f.m.r + step / 2) { hideTip(box); return; }
            var i = Math.max(0, Math.min(pts.length - 1, Math.round((x - f.m.l) / step)));
            cross.setAttribute('x1', xAt(i)); cross.setAttribute('x2', xAt(i)); cross.setAttribute('visibility', 'visible');
            dot.setAttribute('cx', xAt(i)); dot.setAttribute('cy', yAt(pts[i].value)); dot.setAttribute('visibility', 'visible');
            tipAt(box, pts[i].tip, xAt(i) * scale, yAt(pts[i].value) * scale);
        });
        svg.addEventListener('mouseleave', function () {
            hideTip(box); cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden');
        });
    }

    // ---------- 流水 ----------
    function sessionDuration(s) {
        if (s.src === 'js') return s.active_ms > 0 ? s.active_ms / 1000 : null;
        return s.pages > 1 ? s.end_ts - s.start_ts : null;
    }
    function renderStream(res) {
        var box = el('tr-stream');
        el('tr-stream-count').textContent = '共 ' + num(res.total) + ' 次访问 · 最新的在最上面 · 点一行看完整路径';
        if (!res.items.length) {
            box.innerHTML = '<div class="tr-empty">没有符合条件的访问</div>';
            el('tr-pager').innerHTML = '';
            return;
        }
        box.innerHTML = res.items.map(function (s) {
            var place = [s.province || (s.country !== '中国' ? s.country : ''), s.city && s.city !== s.province ? s.city : ''].filter(Boolean).join(' ');
            var geo = s.ip
                ? '<div class="g">' + esc(place || '地区未知') + (s.isp ? '<small>' + esc(s.isp) + '</small>' : '') + '<small class="ip">' + esc(s.ip) + '</small></div>'
                : '<div class="g">地区未知<small>这段历史只有 Cloudflare 节点地址</small></div>';
            var tags = [];
            if (s.src === 'log') tags.push('<span class="tr-tag est">日志估算</span>');
            if (s.visit_no > 1) tags.push('<span class="tr-tag back">第 ' + s.visit_no + ' 次来</span>');
            if (s.internal) tags.push('<span class="tr-tag int">内部</span>');
            (s.actions ? s.actions.split(',') : []).forEach(function (a) { tags.push('<span class="tr-tag act">' + esc(ACT[a] || a) + '</span>'); });
            var d = sessionDuration(s);
            var more = s.pages > 1 ? '浏览 ' + s.pages + ' 页 · 最后停在 ' + esc(s.exit_path) : '只看了这一页';
            return '<div class="tr-sess" data-sid="' + esc(s.sid) + '"><div class="tr-sess-row">' +
                '<div class="t">' + when(s.start_ts) + '<small>' + (s.visit_no > 1 ? '回头客' : '新访客') + '</small></div>' + geo +
                '<div class="c">' + esc(s.channel) + '<small>' + esc(s.ref_host || '') + '</small></div>' +
                '<div class="p"><div class="mob">' + esc([place || (s.ip ? '' : '地区未知'), s.channel].filter(Boolean).join(' · ')) + '</div><div class="ttl">' + esc(pageName(s.landing_title, s.landing)) + '</div><div class="more">' + more + '</div>' + tags.join('') + '</div>' +
                '<div class="d">' + (d == null ? '—' : dur(d)) + '<small>' + esc([s.device, s.os, s.browser].filter(Boolean).join(' · ')) + '</small></div>' +
                '</div></div>';
        }).join('');
        var pages = Math.max(1, Math.ceil(res.total / res.size));
        el('tr-pager').innerHTML = '<span>第 ' + res.page + ' / ' + pages + ' 页</span>' +
            '<button type="button" class="btn btn-outline btn-mini" data-go="-1"' + (res.page <= 1 ? ' disabled' : '') + '>上一页</button>' +
            '<button type="button" class="btn btn-outline btn-mini" data-go="1"' + (res.page >= pages ? ' disabled' : '') + '>下一页</button>';
    }

    function openSession(node) {
        if (node.classList.contains('open')) {
            node.classList.remove('open');
            var old = node.querySelector('.tr-detail');
            if (old) old.remove();
            return;
        }
        node.classList.add('open');
        var det = document.createElement('div');
        det.className = 'tr-detail';
        det.textContent = '读取中…';
        node.appendChild(det);
        api('/stats/session/' + encodeURIComponent(node.getAttribute('data-sid'))).then(function (d) {
            var t0 = d.pages.length ? d.pages[0].ts : 0;
            var items = d.pages.map(function (p) { return { ts: p.ts, html: pageStep(p, t0) }; })
                .concat(d.events.map(function (e) {
                    return { ts: e.ts, html: '<div class="tr-step ev"><div class="when">+' + clock(e.ts - t0) + '</div><div class="what">' + esc(ACT[e.kind] || e.kind) + '<small>' + esc(e.target) + '</small></div></div>' };
                }));
            items.sort(function (a, b) { return a.ts - b.ts; });
            var hist = d.history.length ? '<div class="tr-foot">这个访客之前还来过:' + d.history.map(function (h) {
                return when(h.start_ts) + ' ' + esc(h.channel) + ' → ' + esc(pageName(h.landing_title, h.landing)) + '(' + h.pages + ' 页)';
            }).join(';') + '</div>' : '';
            det.innerHTML = '<div class="tr-steps">' + items.map(function (x) { return x.html; }).join('') + '</div>' + hist +
                '<div class="tr-ua">' + esc(d.ua) + (d.screen ? ' · 屏宽 ' + d.screen + 'px' : '') + (d.lang ? ' · ' + esc(d.lang) : '') + '</div>';
        }).catch(function (err) { det.textContent = '读取失败:' + err.message; });
    }
    function clock(s) {
        s = Math.max(0, Math.round(s));
        var m = Math.floor(s / 60);
        return (m < 10 ? '0' : '') + m + ':' + ((s % 60) < 10 ? '0' : '') + (s % 60);
    }
    function pageStep(p, t0) {
        var extra = [];
        if (p.active_ms > 0) extra.push('看了 ' + dur(p.active_ms / 1000));
        if (p.scroll > 0) extra.push('滑到 ' + p.scroll + '%');
        if (p.query && /utm_|bd_vid|gclid/.test(p.query)) extra.push(esc(p.query));
        return '<div class="tr-step"><div class="when">+' + clock(p.ts - t0) + '</div><div class="what">' + esc(pageName(p.title, p.path)) +
            '<small>' + esc(p.path) + (extra.length ? ' · ' + extra.join(' · ') : '') + '</small></div></div>';
    }

    // ---------- 交互 ----------
    function setOn(group, btn) {
        group.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === btn); });
    }
    el('tr-range').addEventListener('click', function (e) {
        var b = e.target.closest('button[data-range]');
        if (!b) return;
        setOn(this, b);
        state.range = b.getAttribute('data-range');
        state.page = 1;
        schedule();
        load();
    });
    el('tr-metric').addEventListener('click', function (e) {
        var b = e.target.closest('button[data-metric]');
        if (!b || !state.data) return;
        setOn(this, b);
        state.metric = b.getAttribute('data-metric');
        renderTrend(state.data);
    });
    el('tr-regions').addEventListener('click', function (e) {
        var b = e.target.closest('button[data-range-jump]');
        if (!b) return;
        var target = document.querySelector('#tr-range button[data-range="' + b.getAttribute('data-range-jump') + '"]');
        if (target) target.click();
    });
    el('tr-internal').addEventListener('change', function () { state.internal = this.checked; state.page = 1; load(); });
    el('tr-pages-more').addEventListener('click', function () {
        state.allPages = !state.allPages;
        if (state.data) renderPages(state.data.pages);
    });
    el('tr-trend-table-btn').addEventListener('click', function () {
        var t = el('tr-trend-table');
        t.hidden = !t.hidden;
        this.textContent = t.hidden ? '查看数据表' : '收起数据表';
    });
    var qTimer;
    el('tr-q').addEventListener('input', function () {
        clearTimeout(qTimer);
        qTimer = setTimeout(function () { state.page = 1; loadStream(); }, 400);
    });
    ['tr-channel', 'tr-device', 'tr-acted', 'tr-multi'].forEach(function (id) {
        el(id).addEventListener('change', function () { state.page = 1; loadStream(); });
    });
    el('tr-pager').addEventListener('click', function (e) {
        var b = e.target.closest('button[data-go]');
        if (!b || b.disabled) return;
        state.page += +b.getAttribute('data-go');
        loadStream().then(function () { el('tr-stream').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    });
    el('tr-stream').addEventListener('click', function (e) {
        if (e.target.closest('.tr-detail')) return;
        var row = e.target.closest('.tr-sess');
        if (row) openSession(row);
    });
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (!state.data) return;
            renderTrend(state.data);
            renderHours(state.data.hours);
        }, 200);
    });
    function schedule() {
        clearInterval(state.timer);
        if (state.range === 'today') {
            state.timer = setInterval(function () {
                if (document.visibilityState === 'visible' && !document.querySelector('.tr-sess.open')) load(true);
            }, 60000);
        }
    }

    document.addEventListener('DOMContentLoaded', function () { schedule(); load(); });
})();
