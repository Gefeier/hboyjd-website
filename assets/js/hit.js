/* 官网自有访问统计:页面浏览 / 停留时长 / 关键点击 → /_hit(Nginx 记日志,服务器每分钟汇总)
 * 内部设备排除:浏览器打开一次 https://hboyjd.com/?internal=1 ,之后这台设备的访问都标记为内部;?internal=0 取消 */
(function () {
    var w = window, d = document, n = navigator, loc = location;
    if (n.webdriver || loc.protocol.indexOf('http') !== 0 || /^(localhost|127\.|192\.168\.)/.test(loc.hostname)) return;

    function store(s, k, v) {
        try {
            if (v === undefined) return w[s].getItem(k);
            w[s].setItem(k, v);
        } catch (e) { }
        return null;
    }
    function rid() { return Math.random().toString(36).slice(2, 10) + (+new Date()).toString(36).slice(-4); }

    var m = /[?&]internal=([01])/.exec(loc.search);
    if (m) store('localStorage', '_hx', m[1]);
    var internal = store('localStorage', '_hx') === '1' ? 1 : '';

    var isNew = '';
    var vid = store('localStorage', '_hv');
    if (!vid) { vid = rid(); store('localStorage', '_hv', vid); isNew = 1; }

    var now = +new Date();
    var sid = store('sessionStorage', '_hs');
    var last = +(store('sessionStorage', '_hsl') || 0);
    if (!sid || now - last > 1800000) { sid = rid(); store('sessionStorage', '_hs', sid); store('sessionStorage', '_hsn', '0'); }
    var seq = +(store('sessionStorage', '_hsn') || 0) + 1;
    store('sessionStorage', '_hsn', String(seq));
    store('sessionStorage', '_hsl', String(now));
    var pid = rid();

    function send(p) {
        p.v = vid; p.s = sid; p.p = pid;
        if (internal) p.x = 1;
        var q = [];
        for (var k in p) {
            if (p[k] !== '' && p[k] !== undefined && p[k] !== null) q.push(k + '=' + encodeURIComponent(String(p[k]).slice(0, 500)));
        }
        var url = '/_hit?' + q.join('&');
        try {
            if (w.fetch) { w.fetch(url, { method: 'GET', keepalive: true, credentials: 'omit', cache: 'no-store' })['catch'](function () { }); return; }
        } catch (e) { }
        new Image().src = url;
    }

    send({
        e: 'pv', n: seq, nw: isNew,
        u: loc.pathname + loc.search,
        r: d.referrer,
        t: (d.title || '').slice(0, 80),
        sw: w.screen ? screen.width : '',
        lg: n.language || ''
    });

    // 停留:只累计页面可见的时间;滚动深度取最大值
    var active = 0, since = d.visibilityState === 'hidden' ? 0 : +new Date(), maxScroll = 0, sentAt = -1;
    function scrollPct() {
        var h = Math.max(d.documentElement.scrollHeight, d.body ? d.body.scrollHeight : 0) - w.innerHeight;
        return h > 0 ? Math.min(100, Math.round((w.pageYOffset || d.documentElement.scrollTop) / h * 100)) : 100;
    }
    w.addEventListener('scroll', function () { var s = scrollPct(); if (s > maxScroll) maxScroll = s; }, { passive: true });
    function flush() {
        if (since) { active += +new Date() - since; since = 0; }
        if (active === sentAt) return;
        sentAt = active;
        send({ e: 'lv', a: active, sd: Math.max(maxScroll, scrollPct()) });
    }
    d.addEventListener('visibilitychange', function () {
        if (d.visibilityState === 'hidden') flush();
        else since = +new Date();
    });
    w.addEventListener('pagehide', flush);

    // 关键动作:电话 / 抖音 / WhatsApp / 邮件 / 外链 / 表单提交 / data-track
    d.addEventListener('click', function (ev) {
        var el = ev.target;
        while (el && el !== d && !(el.tagName === 'A' || el.hasAttribute && el.hasAttribute('data-track'))) el = el.parentNode;
        if (!el || el === d) return;
        var kind = '', target = '';
        var tag = el.getAttribute('data-track');
        var href = el.getAttribute('href') || '';
        if (tag) { kind = 'track'; target = tag; }
        else if (/^tel:/i.test(href)) { kind = 'tel'; target = href.slice(4); }
        else if (/^mailto:/i.test(href)) { kind = 'mail'; target = href.slice(7); }
        else if (/douyin\.com/i.test(href)) { kind = 'douyin'; target = href; }
        else if (/wa\.me|whatsapp/i.test(href)) { kind = 'whatsapp'; target = href; }
        else if (el.hostname && el.hostname !== loc.hostname && /^https?:/i.test(el.href)) { kind = 'out'; target = el.href; }
        if (kind) send({ e: 'ck', k: kind, g: target, u: loc.pathname });
    }, true);
    d.addEventListener('submit', function (ev) {
        var f = ev.target;
        send({ e: 'ck', k: 'form', g: f.id || f.getAttribute('action') || 'form', u: loc.pathname });
    }, true);
})();
