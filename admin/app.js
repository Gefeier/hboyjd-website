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
    setHeroThumb(hero.image || hero.poster || 'assets/images/factory-gate.webp');

    $('#hero-image-thumb')?.addEventListener('click', () => {
        openImagePicker((image) => {
            data.hero = collectHero(data.hero || {});
            data.hero.image = stripLeadingSlash(image.webp_url || image.jpg_url || image.url);
            setHeroThumb(data.hero.image);
        });
    });

    $('#save-index-btn')?.addEventListener('click', async () => {
        const btn = $('#save-index-btn');
        btn.disabled = true;
        data.hero = collectHero(data.hero || {});
        await saveSection('index', data);
        btn.disabled = false;
        showToast('首页 banner 已暂存，发布后写入 index.html。');
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
    if (!news.length) {
        list.innerHTML = '<p class="muted">暂无新闻，先粘贴公众号链接抓一条。</p>';
        return;
    }
    list.innerHTML = news.map((item, index) => `
        <article class="news-editor" data-index="${index}" data-id="${escapeAttr(item.id || '')}" data-source="${escapeAttr(item.source || 'manual')}">
            <div class="news-cover" style="background-image:url('${escapeAttr(item.cover || '/assets/images/factory-gate.webp')}')"></div>
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
                    <span class="pill">${escapeHtml(item.source || 'manual')}</span>
                    <button type="button" class="btn btn-outline danger" data-delete-news>删除</button>
                </div>
            </div>
        </article>
    `).join('');
    $$('[data-delete-news]', list).forEach((btn) => {
        btn.addEventListener('click', () => {
            btn.closest('.news-editor').remove();
            showToast('已从当前列表移除，点“保存新闻列表”后生效。');
        });
    });
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
