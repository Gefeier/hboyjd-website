// news-detail.js — 站内新闻详情页渲染
// 读 ?id=xxx → fetch news.json → 找该条 → 渲染标题/封面/正文(body 字段已是 HTML)

(function () {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');

    const $loading = document.getElementById('news-detail-loading');
    const $error = document.getElementById('news-detail-error');
    const $content = document.getElementById('news-detail-content');

    function show(el) { el.hidden = false; }
    function hide(el) { el.hidden = true; }

    function fail(reason) {
        hide($loading); hide($content); show($error);
        if (reason) console.warn('news-detail:', reason);
    }

    if (!id) { fail('missing id'); return; }

    fetch('/news.json?t=' + Date.now())
        .then(r => r.json())
        .then(list => {
            const article = list.find(n => n.id === id);
            if (!article) return fail('article not found');
            if (article.site_visible === false) return fail('article not visible');
            render(article);
        })
        .catch(err => fail(err.message));

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text || '';
    }
    function setAttr(id, attr, val) {
        const el = document.getElementById(id);
        if (el) el.setAttribute(attr, val);
    }

    function render(a) {
        const title = a.title || '新闻详情';
        const summary = a.summary || '';
        const cover = a.cover || '';

        document.title = title + ' | 湖北欧阳聚德汽车';
        setAttr('page-title', 'textContent', title);
        const pt = document.getElementById('page-title');
        if (pt) pt.textContent = title;
        setAttr('page-desc', 'content', summary || '湖北欧阳聚德汽车有限公司新闻详情');
        setAttr('og-title', 'content', title);
        setAttr('og-desc', 'content', summary);
        if (cover) setAttr('og-image', 'content', cover.startsWith('http') ? cover : 'https://hboyjd.com' + (cover.startsWith('/') ? cover : '/' + cover));
        const canonical = 'https://hboyjd.com/news-detail.html?id=' + encodeURIComponent(a.id);
        setAttr('page-canonical', 'href', canonical);
        setAttr('og-url', 'content', canonical);

        setText('news-detail-cat', a.category_label || '');
        setText('news-detail-date', a.date || '');
        setText('news-detail-title', title);
        if (summary) setText('news-detail-summary', summary);
        else document.getElementById('news-detail-summary').remove();

        if (cover) {
            const $cover = document.getElementById('news-detail-cover');
            $cover.style.backgroundImage = `url('${cover}')`;
            $cover.hidden = false;
        }

        const $body = document.getElementById('news-detail-body');
        // body 字段是 workshop 渲染好的 HTML(后端把模板填好的安全 HTML)
        // 若是公众号回流文章(没 body),退化为 summary + 阅读全文链接
        if (a.body) {
            $body.innerHTML = a.body;
        } else if (a.url) {
            $body.innerHTML = `<p>${(a.summary || '').replace(/\n/g, '<br>')}</p>
                <p><a href="${a.url}" target="_blank" rel="noopener">阅读全文(公众号原文)→</a></p>`;
        } else {
            $body.innerHTML = '<p>暂无正文。</p>';
        }

        hide($loading); show($content);
    }
})();
