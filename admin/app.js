const API_BASE = window.ADMIN_API_BASE || '/api';

let currentUser = null;
let imageCache = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        ...options,
        headers: {
            ...(options.body instanceof FormData ? {} : {'Content-Type': 'application/json'}),
            ...(options.headers || {})
        }
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
        throw new Error(data?.error || `请求失败: ${res.status}`);
    }
    return data;
}

async function getMe() {
    return api('/auth/me');
}

async function loadSection(name) {
    return api(`/content/${name}`);
}

async function saveSection(name, data) {
    return api(`/content/${name}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function uploadImage(file, extra = {}) {
    const fd = new FormData();
    fd.append('image', file);
    Object.entries(extra).forEach(([key, value]) => {
        if (value) fd.append(key, value);
    });
    return api('/upload/image', {method: 'POST', body: fd});
}

async function fetchFromWechat(url) {
    return api('/news/from-wechat-url', {
        method: 'POST',
        body: JSON.stringify({url})
    });
}

async function publishSite(push = false) {
    return api('/publish', {
        method: 'POST',
        body: JSON.stringify({push})
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        if ($('#login-page')) {
            await initLogin();
            return;
        }
        currentUser = await getMe();
        renderUser();
        bindPublishButtons();
        if ($('#dashboard-page')) await initDashboard();
        if ($('#editor-page')) await initEditor();
        if ($('#images-page')) await initImagesPage();
        if ($('#news-page')) await initNewsPage();
        if ($('#logs-page')) await initLogsPage();
        if ($('#accounts-page')) await initAccountsPage();
    } catch (err) {
        if (err.message.includes('unauthorized')) {
            window.location.href = 'login.html';
            return;
        }
        showToast(err.message, 'error');
    }
});

async function initLogin() {
    const dingBlock = $('#login-dingtalk');
    const passwordForm = $('#login-password-form');
    const mockBlock = $('#login-mock');
    const errBox = $('#login-error');

    let payload = {mode: 'password'};
    try {
        payload = await api('/auth/dingtalk-qrcode');
    } catch (err) {
        // 接不到也走默认密码模式
    }

    if (payload.mode === 'dingtalk') {
        dingBlock.hidden = false;
        const qr = $('#qr-placeholder');
        const msg = $('#login-message');
        if (payload.url) {
            qr.innerHTML = `<iframe title="钉钉扫码登录" src="${escapeAttr(payload.url)}"></iframe>`;
        } else {
            qr.innerHTML = '<span>钉钉扫码<br><small>未配置</small></span>';
        }
        msg.textContent = payload.message || '请使用钉钉扫码登录。';
        return;
    }

    if (payload.mode === 'mock') {
        mockBlock.hidden = false;
        $('#login-enter-btn')?.addEventListener('click', async () => {
            await api('/auth/dingtalk-callback', {
                method: 'POST',
                body: JSON.stringify({name: '市场部演示账号'})
            });
            window.location.href = 'dashboard.html';
        });
        return;
    }

    // 默认: password 模式
    passwordForm.hidden = false;
    passwordForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        errBox.textContent = '';
        const username = $('#login-username').value.trim();
        const password = $('#login-password').value;
        const submit = $('#login-submit');
        submit.disabled = true;
        submit.textContent = '登录中...';
        try {
            await api('/auth/login', {
                method: 'POST',
                body: JSON.stringify({username, password})
            });
            window.location.href = 'dashboard.html';
        } catch (err) {
            errBox.textContent = err.message || '登录失败';
            submit.disabled = false;
            submit.textContent = '登 录';
        }
    });
}

async function initDashboard() {
    const [news, images, logs] = await Promise.all([
        loadSection('news'),
        loadImages(),
        api('/logs?limit=5')
    ]);
    setText('#metric-news', news.length);
    setText('#metric-images', images.length);
    setText('#metric-user', currentUser?.name || '演示账号');
    setText('#last-action', logs[0] ? `${logs[0].action} · ${logs[0].target}` : '暂无操作');
    const list = $('#recent-logs');
    if (list) {
        list.innerHTML = logs.length ? logs.map(renderLogLine).join('') : '<p class="muted">暂无操作日志</p>';
    }
}

// 关于我们页 19 字段(中文 key,英文是 _en/-en 后缀)
const ABOUT_PAGE_KEYS = [
    'ab-hero-eyebrow', 'ab-hero-title', 'ab-hero-tagline',
    'ab-mission-eyebrow', 'ab-mission-headline',
    'ab-stat-area', 'ab-stat-employees', 'ab-stat-capacity', 'ab-stat-patents',
    'ab-give-back-1-title', 'ab-give-back-1-body',
    'ab-give-back-2-title', 'ab-give-back-2-body',
    'ab-give-back-3-title', 'ab-give-back-3-body',
    'ab-cta-slogan', 'ab-cta-title', 'ab-cta-desc', 'ab-cta-tagline',
];
// 新闻动态子页 2 字段
const NEWS_PAGE_KEYS = ['news-hero-title', 'news-hero-tagline'];

// 工具:把 {key:zh, key_en:en} 写到 #key / #key-en input
function loadKvFields(prefix, obj, keys) {
    keys.forEach((k) => {
        setValue(`${prefix}${k}`, obj[k]);
        setValue(`${prefix}${k}-en`, obj[`${k}_en`]);
    });
}
// 工具:从 #key / #key-en 读字段,合到一个 obj({key, key_en})
function collectKvFields(obj, keys) {
    const out = obj || {};
    keys.forEach((k) => {
        const zh = ($(`#${k}`)?.value || '').trim();
        const en = ($(`#${k}-en`)?.value || '').trim();
        out[k] = zh;
        out[`${k}_en`] = en;
    });
    return out;
}

async function initEditor() {
    const data = await loadSection('index');
    const hero = data.hero || {};
    setValue('#hero-subtitle', hero.subtitle);
    setValue('#hero-subtitle-en', hero.subtitle_en);
    setValue('#hero-title', hero.title);
    setValue('#hero-title-en', hero.title_en);
    setValue('#hero-desc', hero.description);
    setValue('#hero-desc-en', hero.description_en);
    setValue('#hero-video', hero.video);
    setValue('#hero-poster', hero.poster);
    const initialBg = hero.image || hero.poster || 'assets/images/factory-gate.webp';
    setHeroThumb(initialBg);

    // 加载 about 区字段
    const aboutD = data.about || {};
    setValue('#about-title', aboutD.title);
    setValue('#about-title-en', aboutD.title_en);
    setValue('#about-subtitle', aboutD.subtitle);
    setValue('#about-subtitle-en', aboutD.subtitle_en);
    setValue('#about-para1', aboutD.para1);
    setValue('#about-para1-en', aboutD.para1_en);
    setValue('#about-para2', aboutD.para2);
    setValue('#about-para2-en', aboutD.para2_en);

    // 加载 about_page 19 字段 + news_page 2 字段
    loadKvFields('#', data.about_page || {}, ABOUT_PAGE_KEYS);
    loadKvFields('#', data.news_page || {}, NEWS_PAGE_KEYS);

    // iframe 桥接 + page tab 切换(替代原 hero 缩略卡)
    bindIframePreview();
    bindPageTabs();

    $('#hero-image-thumb')?.addEventListener('click', () => {
        openImagePicker((image) => {
            data.hero = collectHero(data.hero || {});
            data.hero.image = stripLeadingSlash(image.webp_url || image.jpg_url || image.url);
            setHeroThumb(data.hero.image);
            setHeroPreviewBg(data.hero.image);
        });
    });

    $('#save-index-btn')?.addEventListener('click', async () => {
        const btn = $('#save-index-btn');
        btn.disabled = true;
        data.hero = collectHero(data.hero || {});
        data.about = collectAbout(data.about || {});
        await saveSection('index', data);
        btn.disabled = false;
        showToast('首页内容(Hero+About)已暂存，发布后写入 index.html。');
    });

    initAboutImageReplace();

    $('#translate-en-btn')?.addEventListener('click', async () => {
        const btn = $('#translate-en-btn');
        btn.disabled = true;
        const origText = btn.textContent;
        btn.textContent = '⏳ AI 翻译中...';
        try {
            const items = [
                {key: 'title', text: ($('#hero-title')?.value || '').trim()},
                {key: 'subtitle', text: ($('#hero-subtitle')?.value || '').trim()},
                {key: 'desc', text: ($('#hero-desc')?.value || '').trim()},
            ].filter((x) => x.text);
            if (!items.length) {
                showToast('中文字段都是空的,先填中文再翻译', 'error');
                return;
            }
            const res = await api('/translate-batch', {
                method: 'POST',
                body: JSON.stringify({items}),
            });
            const map = res.translations || {};
            if (map.title && $('#hero-title-en')) $('#hero-title-en').value = map.title;
            if (map.subtitle && $('#hero-subtitle-en')) $('#hero-subtitle-en').value = map.subtitle;
            if (map.desc && $('#hero-desc-en')) $('#hero-desc-en').value = map.desc;
            const filled = Object.keys(map).length;
            showToast(`AI 翻译完成,填了 ${filled} 个英文字段,记得校对`);
        } catch (err) {
            const msg = err.message || '翻译失败';
            showToast(msg.includes('未配置') ? 'AI 服务未配置 — 联系墨在服务器加 ANTHROPIC_API_KEY' : msg, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = origText;
        }
    });

    // 保存「关于我们」页(19 字段)
    $('#save-about-btn')?.addEventListener('click', async () => {
        const btn = $('#save-about-btn');
        btn.disabled = true;
        data.about_page = collectKvFields(data.about_page || {}, ABOUT_PAGE_KEYS);
        await saveSection('index', data);
        btn.disabled = false;
        showToast('关于我们页已暂存,发布后写入 about.html。');
    });

    // 保存「新闻动态」子页(2 字段 hero 文案)
    $('#save-news-btn')?.addEventListener('click', async () => {
        const btn = $('#save-news-btn');
        btn.disabled = true;
        data.news_page = collectKvFields(data.news_page || {}, NEWS_PAGE_KEYS);
        await saveSection('index', data);
        btn.disabled = false;
        showToast('新闻页文案已暂存,发布后写入 news.html。');
    });

    // 自动翻译 about 页全 19 字段中 → 英
    $('#translate-about-btn')?.addEventListener('click', () => translateBatchByKeys('translate-about-btn', ABOUT_PAGE_KEYS));
    // 自动翻译 news 页 hero 2 字段中 → 英
    $('#translate-news-btn')?.addEventListener('click', () => translateBatchByKeys('translate-news-btn', NEWS_PAGE_KEYS));
}

// 通用批量翻译:按 keys 收集中文 → API → 填回 #key-en
async function translateBatchByKeys(btnId, keys) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = true;
    const origText = btn.textContent;
    btn.textContent = '⏳ AI 翻译中...';
    try {
        const items = keys
            .map((k) => ({key: k, text: ($(`#${k}`)?.value || '').trim()}))
            .filter((x) => x.text);
        if (!items.length) {
            showToast('中文字段都是空的,先填中文再翻译', 'error');
            return;
        }
        const res = await api('/translate-batch', {
            method: 'POST',
            body: JSON.stringify({items}),
        });
        const map = res.translations || {};
        let filled = 0;
        keys.forEach((k) => {
            if (map[k] && $(`#${k}-en`)) {
                $(`#${k}-en`).value = map[k];
                filled += 1;
                // 触发 input 事件,推到 iframe 实时反映
                $(`#${k}-en`).dispatchEvent(new Event('input', {bubbles: true}));
            }
        });
        showToast(`AI 翻译完成,填了 ${filled} 个英文字段,记得校对`);
    } catch (err) {
        const msg = err.message || '翻译失败';
        showToast(msg.includes('未配置') ? 'AI 服务未配置 — 联系墨在服务器加 ANTHROPIC_API_KEY' : msg, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = origText;
    }
}

// === iframe 实时预览桥接(L3 替代原 hero 缩略卡) ===
const PREVIEW_FIELD_KEYS = (() => {
    const base = [
        'hero-title', 'hero-title-en',
        'hero-subtitle', 'hero-subtitle-en',
        'hero-desc', 'hero-desc-en',
        'about-title', 'about-title-en',
        'about-subtitle', 'about-subtitle-en',
        'about-para1', 'about-para1-en',
        'about-para2', 'about-para2-en',
    ];
    // about_page 19 字段 + news_page 2 字段(中英)
    const ABOUT_KEYS = [
        'ab-hero-eyebrow', 'ab-hero-title', 'ab-hero-tagline',
        'ab-mission-eyebrow', 'ab-mission-headline',
        'ab-stat-area', 'ab-stat-employees', 'ab-stat-capacity', 'ab-stat-patents',
        'ab-give-back-1-title', 'ab-give-back-1-body',
        'ab-give-back-2-title', 'ab-give-back-2-body',
        'ab-give-back-3-title', 'ab-give-back-3-body',
        'ab-cta-slogan', 'ab-cta-title', 'ab-cta-desc', 'ab-cta-tagline',
    ];
    const NEWS_KEYS = ['news-hero-title', 'news-hero-tagline'];
    [...ABOUT_KEYS, ...NEWS_KEYS].forEach((k) => {
        base.push(k, `${k}-en`);
    });
    return base;
})();

function bindIframePreview() {
    const iframe = $('#editor-preview-iframe');
    if (!iframe) return;

    // 工具:推改动到 iframe
    function pushUpdate(key, value) {
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({type: 'cms-update', key, value}, '*');
        }
    }

    // 监听字段 input 事件
    PREVIEW_FIELD_KEYS.forEach((k) => {
        const inp = document.getElementById(k);
        if (!inp) return;
        inp.addEventListener('input', () => pushUpdate(k, inp.value));
    });

    // 收 iframe 信号:ready / focus 跳字段
    window.addEventListener('message', (ev) => {
        const data = ev.data || {};
        if (data.type === 'cms-preview-ready') {
            // 推一遍当前所有字段值,iframe 立刻反映
            PREVIEW_FIELD_KEYS.forEach((k) => {
                const inp = document.getElementById(k);
                if (inp && inp.value) pushUpdate(k, inp.value);
            });
        } else if (data.type === 'cms-focus' && data.key) {
            // slot: 前缀 → 跳 about 关键图槽位
            if (data.key.startsWith('slot:')) {
                const slotKey = data.key.slice(5);
                const slot = document.querySelector(`.about-img-slot[data-key="${slotKey}"]`);
                if (slot) {
                    slot.scrollIntoView({behavior: 'smooth', block: 'center'});
                    slot.classList.add('field-flash');
                    setTimeout(() => slot.classList.remove('field-flash'), 1200);
                }
                return;
            }
            // 普通 form 字段 → focus + 滚动 + 闪烁
            const inp = document.getElementById(data.key);
            if (inp) {
                inp.focus();
                inp.scrollIntoView({behavior: 'smooth', block: 'center'});
                inp.classList.add('field-flash');
                setTimeout(() => inp.classList.remove('field-flash'), 1200);
            }
        }
    });

    // 刷新按钮
    $('#preview-refresh')?.addEventListener('click', () => {
        const cur = $('#editor-preview-iframe');
        if (cur) cur.src = cur.src;
    });
}

function bindPageTabs() {
    const tabs = $$('.page-tab');
    if (!tabs.length) return;
    const PAGE_LABEL = {
        'index': '首页 · index.html',
        'about': '关于我们 · about.html',
        'news': '新闻动态 · news.html',
    };
    function applyPage(page) {
        tabs.forEach((b) => b.classList.toggle('active', b.dataset.page === page));
        const iframe = $('#editor-preview-iframe');
        if (iframe) iframe.src = `/admin/preview/${page}.html`;
        const cur = $('#preview-current');
        if (cur) cur.textContent = PAGE_LABEL[page] || `${page}.html`;
        // 切左侧 section 显隐:section.data-page=xxx 只在对应 tab 显;无 data-page 属性的 section 永远显
        $$('.editor-section').forEach((sec) => {
            const belongs = sec.dataset.page;
            sec.style.display = !belongs || belongs === page ? '' : 'none';
        });
    }
    tabs.forEach((btn) => {
        btn.addEventListener('click', () => applyPage(btn.dataset.page));
    });
    // 初次加载主动跑一遍当前 active tab,防 about/news 的 section 在 index tab 时露出
    const activeBtn = tabs.find((b) => b.classList.contains('active')) || tabs[0];
    applyPage(activeBtn.dataset.page);
}

function initAboutImageReplace() {
    const uploader = $('#about-image-uploader');
    if (!uploader) return;

    // 初始化每个 slot 的缩略图(从 data-img 读)
    $$('.about-img-slot .about-img-thumb').forEach((el) => {
        const url = el.dataset.img || '';
        if (url) el.style.backgroundImage = `url('${escapeAttr(url)}?t=${Date.now()}')`;
    });

    let activeKey = null;
    $$('.about-img-slot').forEach((btn) => {
        btn.addEventListener('click', () => {
            activeKey = btn.dataset.key;
            uploader.click();
        });
    });

    uploader.addEventListener('change', async (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file || !activeKey) {
            uploader.value = '';
            return;
        }
        const fd = new FormData();
        fd.append('key', activeKey);
        fd.append('file', file);
        const slot = document.querySelector(`.about-img-slot[data-key="${activeKey}"]`);
        if (slot) slot.classList.add('uploading');
        try {
            const res = await fetch(`${API_BASE}/replace-about-image`, {
                method: 'POST',
                credentials: 'include',
                body: fd,
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            // 立即刷新缩略图(加时间戳防 cache)
            const thumb = slot?.querySelector('.about-img-thumb');
            if (thumb && data.entry) {
                thumb.style.backgroundImage = `url('${escapeAttr(data.entry.jpg_url)}?t=${Date.now()}')`;
            }
            showToast(`「${data.label || activeKey}」已换图,记得点发布预演`);
        } catch (err) {
            showToast(err.message || '上传失败', 'error');
        } finally {
            if (slot) slot.classList.remove('uploading');
            uploader.value = '';
            activeKey = null;
        }
    });
}

async function initImagesPage() {
    $('#refresh-images-btn')?.addEventListener('click', async () => {
        imageCache = await loadImages(true);
        renderImageGrid('#images-grid', imageCache);
    });
    $('#upload-input')?.addEventListener('change', async (event) => {
        await handleUploadFiles(event.target.files, $('#upload-status'));
        event.target.value = '';
        imageCache = await loadImages(true);
        renderImageGrid('#images-grid', imageCache);
    });
    renderImageGrid('#images-grid', await loadImages());
}

async function initNewsPage() {
    let news = await loadSection('news');
    renderNewsList(news);
    bindNewsToolbar();

    $('#fetch-wechat-btn')?.addEventListener('click', async () => {
        const input = $('#wechat-url-input');
        const btn = $('#fetch-wechat-btn');
        const url = input.value.trim();
        if (!url) return showToast('先粘贴公众号文章链接。', 'error');
        btn.disabled = true;
        btn.textContent = '抓取中...';
        try {
            await fetchFromWechat(url);
            input.value = '';
            news = await loadSection('news');
            renderNewsList(news);
            showToast('公众号文章已加入新闻列表。');
        } finally {
            btn.disabled = false;
            btn.textContent = '抓取并添加';
        }
    });

    $('#save-news-btn')?.addEventListener('click', async () => {
        news = collectNewsList();
        await saveSection('news', news);
        renderNewsList(news);
        showToast('新闻列表已暂存。');
    });

    $('#batch-import-btn')?.addEventListener('click', async () => {
        const text = $('#batch-urls').value.trim();
        const urls = text.split(/\s+/).map((u) => u.trim()).filter((u) => /^https?:\/\//.test(u));
        if (!urls.length) return showToast('没识别到任何 http(s) URL', 'error');
        if (!confirm(`确认批量导入 ${urls.length} 个公众号文章?约需 ${Math.ceil(urls.length * 1.5)} 秒,请勿关闭页面。`)) return;
        const btn = $('#batch-import-btn');
        const resultBox = $('#batch-result');
        btn.disabled = true;
        btn.textContent = `导入中(0/${urls.length})...`;
        resultBox.hidden = false;
        resultBox.innerHTML = `<p class="muted">提交了 ${urls.length} 条,后端开始抓取... 大约 ${Math.ceil(urls.length * 1.5)} 秒后完成,请耐心等。</p>`;
        try {
            const res = await api('/news/batch-import', {
                method: 'POST',
                body: JSON.stringify({urls, default_category: $('#batch-category').value})
            });
            resultBox.innerHTML = `
                <div class="batch-summary">
                    <strong>完成:</strong> 共 ${res.total} 条,成功 ${res.success},新增 ${res.inserted},失败 ${res.total - res.success}
                </div>
                ${res.results.map((r) => r.ok
                    ? `<div class="batch-row ok"><span class="batch-icon">✓</span><div><strong>${escapeHtml(r.title || '(无标题)')}</strong> <small class="muted">${escapeHtml(r.date || '')} ${r.inserted ? '· 新增' : '· 已存在,已更新'}</small><br><small class="muted">${escapeHtml(r.url)}</small></div></div>`
                    : `<div class="batch-row err"><span class="batch-icon">✗</span><div><strong>抓取失败</strong> <small>${escapeHtml(r.error)}</small><br><small class="muted">${escapeHtml(r.url)}</small></div></div>`
                ).join('')}`;
            showToast(`完成: 成功 ${res.success}/${res.total}`, res.success === res.total ? 'ok' : 'error');
            $('#batch-urls').value = '';
            news = await loadSection('news');
            renderNewsList(news);
        } catch (err) {
            resultBox.innerHTML = `<div class="batch-row err">批量导入失败: ${escapeHtml(err.message)}</div>`;
        } finally {
            btn.disabled = false;
            btn.textContent = '开始批量导入';
        }
    });
}

async function initLogsPage() {
    const logs = await api('/logs?limit=50');
    const target = $('#logs-list');
    if (!target) return;
    target.innerHTML = logs.length ? logs.map(renderLogLine).join('') : '<p class="muted">暂无操作日志</p>';
}

function bindPublishButtons() {
    $$('[data-publish]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.textContent = '发布预演中...';
            try {
                const result = await publishSite(false);
                showToast(result.pushed ? '已发布并推送。' : '本地构建通过，等待服务器凭证后开启 git push。');
            } finally {
                btn.disabled = false;
                btn.textContent = '发布预演';
            }
        });
    });
}

async function loadImages(refresh = false) {
    if (imageCache && !refresh) return imageCache;
    imageCache = await api(`/images${refresh ? '?refresh=1' : ''}`);
    return imageCache;
}

async function handleUploadFiles(files, statusEl) {
    const list = Array.from(files || []);
    if (!list.length) return;
    statusEl && (statusEl.textContent = `上传中 0/${list.length}`);
    for (let i = 0; i < list.length; i += 1) {
        await uploadImage(list[i], {folder: 'about'});
        statusEl && (statusEl.textContent = `上传中 ${i + 1}/${list.length}`);
    }
    statusEl && (statusEl.textContent = '上传完成，已生成 jpg + webp。');
}

function renderImageGrid(selector, images, onPick) {
    const grid = typeof selector === 'string' ? $(selector) : selector;
    if (!grid) return;
    if (!images.length) {
        grid.innerHTML = '<p class="muted">图片库为空。</p>';
        return;
    }
    grid.innerHTML = images.map((image, index) => `
        <button class="image-card" type="button" data-index="${index}">
            <span class="image-card-thumb" style="background-image:url('${escapeAttr(image.webp_url || image.jpg_url || image.url)}')"></span>
            <span class="image-card-name">${escapeHtml(image.basename)}</span>
            <span class="image-card-folder">${escapeHtml(image.folder || '')}</span>
        </button>
    `).join('');
    if (onPick) {
        $$('.image-card', grid).forEach((card) => {
            card.addEventListener('click', () => onPick(images[Number(card.dataset.index)]));
        });
    }
}

async function openImagePicker(onPick) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-panel" role="dialog" aria-modal="true">
            <div class="modal-head">
                <div>
                    <h2>选择图片</h2>
                    <p class="muted">点击已有图片，或上传新图自动生成 webp。</p>
                </div>
                <button type="button" class="icon-btn" data-close>×</button>
            </div>
            <div class="modal-tools">
                <input type="file" accept="image/*" id="picker-upload">
                <span id="picker-status" class="muted"></span>
            </div>
            <div class="image-grid compact" id="picker-grid"></div>
        </div>
    `;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    $('[data-close]', modal).addEventListener('click', close);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) close();
    });
    const render = async (refresh = false) => {
        const images = await loadImages(refresh);
        renderImageGrid($('#picker-grid', modal), images, (image) => {
            onPick(image);
            close();
        });
    };
    $('#picker-upload', modal).addEventListener('change', async (event) => {
        await handleUploadFiles(event.target.files, $('#picker-status', modal));
        await render(true);
    });
    await render();
}

function renderNewsList(news) {
    const list = $('#news-list');
    if (!list) return;
    updateNewsCount(news.length);
    if (!news.length) {
        list.innerHTML = '<p class="muted">暂无新闻，先粘贴公众号链接抓一条。</p>';
        return;
    }
    list.innerHTML = news.map((item, index) => {
        const isHidden = item.site_visible === false;
        return `
        <article class="news-editor${item.important ? ' is-important' : ''}${isHidden ? ' is-hidden-from-site' : ''}" data-index="${index}" data-id="${escapeAttr(item.id || '')}" data-source="${escapeAttr(item.source || 'manual')}" data-category="${escapeAttr(item.category || 'company')}">
            <div class="news-card-header">
                <div class="news-cover" style="background-image:url('${escapeAttr(item.cover || '/assets/images/factory-gate.webp')}')"></div>
                <div class="news-card-meta">
                    <div class="news-card-title">${item.important ? '<span class="news-imp-mark news-imp-shimmer" title="重要消息">★</span> ' : ''}${isHidden ? '<span class="hide-mark" title="不上官网">🚫</span> ' : ''}${escapeHtml(item.title || '(无标题)')}</div>
                    <div class="news-card-sub">
                        <span class="cat-badge cat-${escapeAttr(item.category || 'company')}">${escapeHtml(item.category_label || categoryLabelZh(item.category))}</span>
                        <span class="news-card-date">${escapeHtml(item.date || '')}</span>
                        <span class="pill">${escapeHtml(item.source || 'manual')}</span>
                        ${isHidden ? '<span class="pill pill-hidden">公众号自留 · 不上官网</span>' : ''}
                    </div>
                </div>
                <div class="news-card-tools">
                    <button type="button" class="icon-btn star-btn${item.important ? ' is-on' : ''}" data-act="toggle-important" title="标记重要消息(官网会金色一闪一闪)">★</button>
                    <button type="button" class="icon-btn eye-btn${isHidden ? ' is-off' : ''}" data-act="toggle-site-visible" title="${isHidden ? '当前不上官网,点亮则恢复显示' : '当前上官网,点击切换为不上官网'}">${isHidden ? '🚫' : '👁'}</button>
                    <button type="button" class="icon-btn" data-act="up" title="上移">↑</button>
                    <button type="button" class="icon-btn" data-act="down" title="下移">↓</button>
                    <button type="button" class="icon-btn" data-act="copy-url" title="复制原文 URL">⧉</button>
                </div>
            </div>
            <input type="hidden" data-field="important" value="${item.important ? '1' : ''}">
            <input type="hidden" data-field="site_visible" value="${isHidden ? '0' : '1'}">
            <div class="news-fields">
                <div class="form-row two">
                    <label>标题<input type="text" data-field="title" value="${escapeAttr(item.title || '')}"></label>
                    <label>日期<input type="text" data-field="date" value="${escapeAttr(item.date || '')}"></label>
                </div>
                <label>摘要<textarea data-field="summary">${escapeHtml(item.summary || '')}</textarea></label>
                <div class="form-row two">
                    <label>分类
                        <select data-field="category">
                            ${categoryOption('company', '公司动态', item.category)}
                            ${categoryOption('gov', '党政动态', item.category)}
                            ${categoryOption('case', '客户案例', item.category)}
                        </select>
                    </label>
                    <label>封面 URL<input type="text" data-field="cover" value="${escapeAttr(item.cover || '')}"></label>
                </div>
                <label>原文 URL<input type="url" data-field="url" value="${escapeAttr(item.url || '')}"></label>
                <div class="row-actions">
                    <button type="button" class="btn btn-outline danger" data-delete-news>删除</button>
                </div>
            </div>
        </article>`;
    }).join('');
    bindNewsRowActions(list);
    applyNewsFilter();
}

function bindNewsRowActions(list) {
    $$('[data-delete-news]', list).forEach((btn) => {
        btn.addEventListener('click', () => {
            if (!confirm('确认从列表移除? 点「保存」+「发布预演」后才真生效。')) return;
            btn.closest('.news-editor').remove();
            updateNewsCount($$('.news-editor', list).length);
            showToast('已从当前列表移除,记得保存+发布。');
        });
    });
    $$('[data-act]', list).forEach((btn) => {
        btn.addEventListener('click', () => handleNewsRowAction(btn.dataset.act, btn.closest('.news-editor')));
    });
    // category 变更立即更新卡片徽章
    $$('select[data-field="category"]', list).forEach((sel) => {
        sel.addEventListener('change', () => {
            const article = sel.closest('.news-editor');
            article.dataset.category = sel.value;
            const badge = article.querySelector('.cat-badge');
            if (badge) {
                badge.className = 'cat-badge cat-' + sel.value;
                badge.textContent = categoryLabelZh(sel.value);
            }
            applyNewsFilter();
        });
    });
    // title 变更立即更新卡片标题
    $$('input[data-field="title"]', list).forEach((inp) => {
        inp.addEventListener('input', () => {
            const article = inp.closest('.news-editor');
            const t = article.querySelector('.news-card-title');
            if (t) t.textContent = inp.value || '(无标题)';
        });
    });
}

function handleNewsRowAction(act, article) {
    if (!article) return;
    if (act === 'up') {
        const prev = article.previousElementSibling;
        if (prev && prev.classList.contains('news-editor')) {
            article.parentNode.insertBefore(article, prev);
        }
    } else if (act === 'down') {
        const next = article.nextElementSibling;
        if (next && next.classList.contains('news-editor')) {
            article.parentNode.insertBefore(next, article);
        }
    } else if (act === 'copy-url') {
        const url = article.querySelector('input[data-field="url"]')?.value || '';
        if (!url) return showToast('原文 URL 为空', 'error');
        navigator.clipboard.writeText(url).then(
            () => showToast('已复制原文 URL'),
            () => showToast('复制失败,手动复制吧', 'error')
        );
    } else if (act === 'toggle-site-visible') {
        const hidden = article.querySelector('input[data-field="site_visible"]');
        const eye = article.querySelector('.eye-btn');
        const isHidden = hidden && hidden.value === '0';  // 当前藏
        if (hidden) hidden.value = isHidden ? '1' : '0';
        article.classList.toggle('is-hidden-from-site', !isHidden);
        if (eye) {
            eye.classList.toggle('is-off', !isHidden);
            eye.textContent = !isHidden ? '🚫' : '👁';
            eye.title = !isHidden ? '当前不上官网,点亮则恢复显示' : '当前上官网,点击切换为不上官网';
        }
        showToast(!isHidden ? '已藏 — 保存+发布后官网新闻区不再显示这条' : '已恢复显示 — 保存+发布后官网新闻区会出现');
    } else if (act === 'toggle-important') {
        const hidden = article.querySelector('input[data-field="important"]');
        const star = article.querySelector('.star-btn');
        const isOn = hidden && hidden.value === '1';
        if (hidden) hidden.value = isOn ? '' : '1';
        article.classList.toggle('is-important', !isOn);
        if (star) star.classList.toggle('is-on', !isOn);
        // 同步卡片标题前的 ★ 标记
        const titleEl = article.querySelector('.news-card-title');
        const titleInp = article.querySelector('input[data-field="title"]');
        const t = titleInp ? titleInp.value : (titleEl ? titleEl.textContent.replace(/^★\s*/, '') : '');
        if (titleEl) {
            titleEl.innerHTML = (!isOn ? '<span class="news-imp-mark news-imp-shimmer" title="重要消息">★</span> ' : '') + (t || '(无标题)').replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
        }
        showToast(!isOn ? '已标重要 — 保存+发布后官网金色闪烁' : '已取消重要标记');
    }
}

function bindNewsToolbar() {
    const search = $('#news-search');
    const filter = $('#news-filter');
    if (search) search.addEventListener('input', applyNewsFilter);
    if (filter) {
        filter.addEventListener('click', (ev) => {
            const btn = ev.target.closest('.filter-pill');
            if (!btn) return;
            $$('.filter-pill', filter).forEach((b) => b.classList.toggle('active', b === btn));
            applyNewsFilter();
        });
    }
}

function applyNewsFilter() {
    const list = $('#news-list');
    if (!list) return;
    const q = ($('#news-search')?.value || '').trim().toLowerCase();
    const activeFilter = $('#news-filter .filter-pill.active');
    const cat = activeFilter ? activeFilter.dataset.filter : 'all';
    let visible = 0, total = 0;
    $$('.news-editor', list).forEach((article) => {
        total += 1;
        const title = (article.querySelector('input[data-field="title"]')?.value || '').toLowerCase();
        const summary = (article.querySelector('textarea[data-field="summary"]')?.value || '').toLowerCase();
        const itemCat = article.dataset.category || 'company';
        const matchQ = !q || title.includes(q) || summary.includes(q);
        const matchC = cat === 'all' || itemCat === cat;
        const show = matchQ && matchC;
        article.classList.toggle('news-hidden', !show);
        if (show) visible += 1;
    });
    updateNewsCount(visible, total);
}

function updateNewsCount(visible, total) {
    const el = $('#news-count');
    if (!el) return;
    if (total === undefined || visible === total) {
        el.textContent = visible ? `(共 ${visible} 条)` : '';
    } else {
        el.textContent = `(显示 ${visible} / 共 ${total} 条)`;
    }
}

function categoryLabelZh(cat) {
    return cat === 'gov' ? '党政动态' : cat === 'case' ? '客户案例' : '公司动态';
}

function collectNewsList() {
    return $$('.news-editor').map((row) => {
        const oldIndex = Number(row.dataset.index);
        const item = {};
        $$('[data-field]', row).forEach((input) => {
            item[input.dataset.field] = input.value.trim();
        });
        item.id = row.dataset.id || `news-${Date.now()}-${oldIndex}`;
        item.title_en = '';
        item.summary_en = '';
        item.category_label = labelForCategory(item.category);
        item.category_label_en = item.category === 'gov' ? 'Government & Party' : item.category === 'case' ? 'Customer Stories' : 'Company News';
        item.source = row.dataset.source || 'manual';
        // important 转 bool(空字符串/'0'→false,'1'→true)
        item.important = item.important === '1' || item.important === 'true' || item.important === true;
        if (!item.important) delete item.important; // 不写 false 进 json,保持简洁
        // site_visible:'0'→false 写 json;'1'→true 不写(默认上官网)
        const sv = item.site_visible;
        if (sv === '0' || sv === 0 || sv === false) item.site_visible = false;
        else delete item.site_visible;
        return item;
    });
}

function collectHero(previous) {
    return {
        ...previous,
        subtitle: value('#hero-subtitle'),
        subtitle_en: value('#hero-subtitle-en'),
        title: value('#hero-title'),
        title_en: value('#hero-title-en'),
        description: value('#hero-desc'),
        description_en: value('#hero-desc-en'),
        video: value('#hero-video'),
        poster: value('#hero-poster')
    };
}

function collectAbout(previous) {
    return {
        ...previous,
        title: value('#about-title') || (previous && previous.title) || '',
        title_en: value('#about-title-en') || (previous && previous.title_en) || '',
        subtitle: value('#about-subtitle') || (previous && previous.subtitle) || '',
        subtitle_en: value('#about-subtitle-en') || (previous && previous.subtitle_en) || '',
        para1: value('#about-para1') || (previous && previous.para1) || '',
        para1_en: value('#about-para1-en') || (previous && previous.para1_en) || '',
        para2: value('#about-para2') || (previous && previous.para2) || '',
        para2_en: value('#about-para2-en') || (previous && previous.para2_en) || '',
    };
}

function renderLogLine(log) {
    return `
        <div class="log-line">
            <div>
                <strong>${escapeHtml(log.action)}</strong>
                <span>${escapeHtml(log.target)}</span>
            </div>
            <p>${escapeHtml(log.diff_summary || '')}</p>
            <time>${escapeHtml(log.ts || '')} · ${escapeHtml(log.user || '')}</time>
        </div>
    `;
}

function renderUser() {
    $$('.js-user-name').forEach((node) => {
        node.textContent = currentUser?.name || '市场部同事';
    });
    injectSidebarFooter();
}

function injectSidebarFooter() {
    // 给 admin 注入「账号管理」入口(在 nav 末尾)
    if (currentUser?.role === 'admin') {
        $$('.sidebar-nav').forEach((nav) => {
            if (nav.querySelector('a[href="accounts.html"]')) return;
            const link = document.createElement('a');
            link.href = 'accounts.html';
            link.textContent = '账号管理';
            if (location.pathname.endsWith('accounts.html')) link.classList.add('active');
            nav.appendChild(link);
        });
    }
    // 注入底部「当前账号 + 改密码 + 退出」
    $$('.sidebar').forEach((sidebar) => {
        if (sidebar.querySelector('.sidebar-footer')) return;
        const name = currentUser?.name || '';
        const userid = currentUser?.userid || '';
        const role = currentUser?.role || '';
        const footer = document.createElement('div');
        footer.className = 'sidebar-footer';
        footer.innerHTML = `
            <div class="sidebar-user">当前账号 · ${escapeAttr(role)}</div>
            <div class="sidebar-user-name" title="${escapeAttr(userid)}">${escapeAttr(name)}</div>
            <button type="button" class="sidebar-changepw-btn js-changepw">修改密码</button>
            <button type="button" class="sidebar-logout-btn js-logout">退出登录</button>
        `;
        sidebar.appendChild(footer);
    });
    $$('.js-logout').forEach((btn) => btn.addEventListener('click', logout));
    $$('.js-changepw').forEach((btn) => btn.addEventListener('click', openSelfChangePw));
}

function openSelfChangePw() {
    // 给所有页面注入(若不存在)一个改自己密码的简易 modal
    if (!$('#self-changepw-modal')) {
        const div = document.createElement('div');
        div.id = 'self-changepw-modal';
        div.className = 'modal-mask';
        div.innerHTML = `
            <div class="modal-card">
                <h3>修改我的密码</h3>
                <form class="modal-form" id="self-changepw-form">
                    <label>旧密码</label>
                    <input type="password" name="old_password" required autocomplete="current-password">
                    <label>新密码(至少 6 位)</label>
                    <input type="password" name="new_password" required minlength="6" autocomplete="new-password">
                    <p class="modal-error" id="self-changepw-error"></p>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-outline" data-close>取消</button>
                        <button type="submit" class="btn btn-primary">保存</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(div);
        div.querySelector('[data-close]').addEventListener('click', () => div.hidden = true);
        div.addEventListener('click', (e) => { if (e.target === div) div.hidden = true; });
        $('#self-changepw-form').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.target);
            try {
                await api('/auth/change-password', {
                    method: 'POST',
                    body: JSON.stringify({old_password: fd.get('old_password'), new_password: fd.get('new_password')})
                });
                $('#self-changepw-error').textContent = '';
                showToast('密码已更新', 'ok');
                div.hidden = true;
                ev.target.reset();
            } catch (err) {
                $('#self-changepw-error').textContent = err.message || '改密失败';
            }
        });
    }
    $('#self-changepw-modal').hidden = false;
}

async function logout() {
    try {
        await api('/auth/logout', {method: 'POST'});
    } catch (err) {
        // 即使后端清不掉也跳登录页
    }
    window.location.href = 'login.html';
}

function setHeroThumb(url) {
    const thumb = $('#hero-image-thumb');
    if (thumb) thumb.style.backgroundImage = `url('${escapeAttr(toPublicUrl(url))}')`;
}

function categoryOption(value, label, current) {
    return `<option value="${value}" ${value === current ? 'selected' : ''}>${label}</option>`;
}

function labelForCategory(value) {
    return value === 'gov' ? '党政动态' : value === 'case' ? '客户案例' : '公司动态';
}

function toPublicUrl(url) {
    if (!url) return '';
    if (/^https?:\/\//.test(url)) return url;
    return url.startsWith('/') ? url : `/${url}`;
}

function stripLeadingSlash(url) {
    return (url || '').replace(/^\//, '');
}

function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value ?? '';
}

function setValue(selector, value) {
    const node = $(selector);
    if (node) node.value = value ?? '';
}

function value(selector) {
    return ($(selector)?.value || '').trim();
}

function showToast(message, type = 'ok') {
    let toast = $('#admin-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'admin-toast';
        document.body.appendChild(toast);
    }
    toast.className = `toast ${type}`;
    toast.textContent = message;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.remove(), 3200);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
    return escapeHtml(value).replaceAll('\n', ' ');
}

// ===== 账号管理 =====
async function initAccountsPage() {
    if (currentUser?.role !== 'admin') {
        $('#accounts-page').innerHTML = '<div class="card"><h2>无权访问</h2><p class="muted">账号管理仅 admin 可用。</p></div>';
        return;
    }
    await refreshUsersTable();
    bindAccountsModals();
}

async function refreshUsersTable() {
    const wrap = $('#users-table-wrap');
    wrap.innerHTML = '<p class="muted">加载中...</p>';
    try {
        const users = await api('/users');
        if (!users.length) { wrap.innerHTML = '<p class="muted">无账号(异常,至少应有 admin)</p>'; return; }
        const rows = users.map((u) => {
            const isSelf = u.userid === currentUser.userid;
            const roleBadge = u.role === 'admin'
                ? '<span class="role-badge role-admin">admin</span>'
                : '<span class="role-badge role-editor">editor</span>';
            const status = u.disabled
                ? '<span class="muted">已停用</span>'
                : '<span style="color:#1a8a3a;">启用中</span>';
            const lastLogin = u.last_login ? formatTime(u.last_login) : '从未登录';
            const created = u.created_at ? formatTime(u.created_at) : '-';
            const actions = [];
            actions.push(`<button class="btn btn-mini btn-outline" data-act="changepw" data-uid="${escapeAttr(u.userid)}">改密码</button>`);
            if (!isSelf) {
                if (u.role === 'editor') {
                    actions.push(`<button class="btn btn-mini btn-outline" data-act="role" data-uid="${escapeAttr(u.userid)}" data-role="admin">→admin</button>`);
                } else {
                    actions.push(`<button class="btn btn-mini btn-outline" data-act="role" data-uid="${escapeAttr(u.userid)}" data-role="editor">→editor</button>`);
                }
                if (u.disabled) {
                    actions.push(`<button class="btn btn-mini btn-outline" data-act="enable" data-uid="${escapeAttr(u.userid)}">启用</button>`);
                } else {
                    actions.push(`<button class="btn btn-mini btn-danger" data-act="disable" data-uid="${escapeAttr(u.userid)}">停用</button>`);
                }
            } else {
                actions.push('<span class="muted" style="font-size:12px;">(本人)</span>');
            }
            return `<tr>
                <td><code>${escapeAttr(u.userid)}</code></td>
                <td>${escapeAttr(u.name)}</td>
                <td>${roleBadge}</td>
                <td>${status}</td>
                <td><small>${escapeAttr(lastLogin)}</small></td>
                <td><small class="muted">${escapeAttr(created)}</small></td>
                <td class="row-actions">${actions.join(' ')}</td>
            </tr>`;
        }).join('');
        wrap.innerHTML = `<table class="users-table">
            <thead><tr><th>账号</th><th>姓名</th><th>角色</th><th>状态</th><th>最后登录</th><th>创建于</th><th>操作</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
        wrap.querySelectorAll('button[data-act]').forEach((btn) => {
            btn.addEventListener('click', () => handleUserAction(btn.dataset.act, btn.dataset.uid, btn.dataset));
        });
    } catch (err) {
        wrap.innerHTML = `<p class="login-error">${escapeHtml(err.message)}</p>`;
    }
}

async function handleUserAction(act, uid, ds) {
    try {
        if (act === 'changepw') {
            return openAdminChangePw(uid);
        }
        if (act === 'role') {
            if (!confirm(`确认把 ${uid} 改成 ${ds.role}?`)) return;
            await api(`/users/${encodeURIComponent(uid)}`, {method: 'PATCH', body: JSON.stringify({role: ds.role})});
            showToast(`${uid} 角色已改 → ${ds.role}`, 'ok');
        } else if (act === 'disable') {
            if (!confirm(`确认停用 ${uid}? 停用后无法登录,但记录保留。`)) return;
            await api(`/users/${encodeURIComponent(uid)}`, {method: 'PATCH', body: JSON.stringify({disabled: true})});
            showToast(`${uid} 已停用`, 'ok');
        } else if (act === 'enable') {
            await api(`/users/${encodeURIComponent(uid)}`, {method: 'PATCH', body: JSON.stringify({disabled: false})});
            showToast(`${uid} 已启用`, 'ok');
        }
        await refreshUsersTable();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function openAdminChangePw(uid) {
    const modal = $('#modal-change-pw');
    $('#change-pw-title').textContent = `给 ${uid} 重置密码`;
    $('#old-pw-label').hidden = true;
    $('#old-pw-input').hidden = true;
    $('#old-pw-input').required = false;
    modal.dataset.uid = uid;
    modal.dataset.mode = 'admin';
    modal.hidden = false;
    $('#change-pw-error').textContent = '';
    modal.querySelector('input[name="new_password"]').value = '';
    modal.querySelector('input[name="new_password"]').focus();
}

function bindAccountsModals() {
    const newModal = $('#modal-new');
    $('#btn-new-user').addEventListener('click', () => {
        newModal.querySelector('form').reset();
        $('#new-error').textContent = '';
        newModal.hidden = false;
        newModal.querySelector('input[name="userid"]').focus();
    });
    newModal.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => newModal.hidden = true));
    newModal.addEventListener('click', (e) => { if (e.target === newModal) newModal.hidden = true; });
    $('#form-new-user').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        try {
            await api('/users', {method: 'POST', body: JSON.stringify(Object.fromEntries(fd))});
            $('#new-error').textContent = '';
            newModal.hidden = true;
            showToast('账号已创建', 'ok');
            await refreshUsersTable();
        } catch (err) {
            $('#new-error').textContent = err.message;
        }
    });

    const pwModal = $('#modal-change-pw');
    pwModal.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => pwModal.hidden = true));
    pwModal.addEventListener('click', (e) => { if (e.target === pwModal) pwModal.hidden = true; });
    $('#form-change-pw').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        const uid = pwModal.dataset.uid;
        try {
            await api(`/users/${encodeURIComponent(uid)}`, {
                method: 'PATCH',
                body: JSON.stringify({password: fd.get('new_password')})
            });
            $('#change-pw-error').textContent = '';
            pwModal.hidden = true;
            ev.target.reset();
            showToast(`${uid} 密码已重置`, 'ok');
        } catch (err) {
            $('#change-pw-error').textContent = err.message;
        }
    });
}

function formatTime(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
        return iso;
    }
}
