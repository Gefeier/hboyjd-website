// admin/workshop.js — 创作工坊 v2 (AI 主笔模式)
// 工作流: 丢素材 (文字 + 图 + 意图) → AI 起稿 (自动判分类+选模板+出整篇 HTML)
//        → contenteditable 编辑 → AI 再调指令 → 发布拿采集 URL

(function () {
    if (!document.getElementById('workshop-page')) return;

    const SAVE_API = '/workshop/save';
    const DRAFT_FULL_API = '/ai/draft-full';
    const REVISE_API = '/ai/revise';
    const DRAFTS_API = '/workshop/drafts';

    let images = [];          // [{url, label}]
    let articleMeta = {};     // { id, template_id, category, title, summary }
    let lastSourceText = '';
    let lastIntent = '';

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        try { await window.getMe?.(); } catch { location.href = 'login.html'; return; }
        bindEvents();
        document.getElementById('wsx-date').value = new Date().toISOString().slice(0, 10);
    }

    function bindEvents() {
        document.getElementById('wsx-draft-btn').addEventListener('click', onDraftFull);
        document.getElementById('wsx-revise-btn').addEventListener('click', onRevise);
        document.getElementById('wsx-publish-btn').addEventListener('click', () => savePublish(false));
        document.getElementById('wsx-save-draft-btn').addEventListener('click', () => savePublish(true));
        document.getElementById('wsx-preview-refresh').addEventListener('click', syncPreview);
        document.getElementById('wsx-load-draft-btn').addEventListener('click', openLoadDraft);
        document.getElementById('wsx-modal-close').addEventListener('click', closeSuccessModal);
        document.querySelector('#wsx-success-modal .wsx-modal-backdrop')?.addEventListener('click', closeSuccessModal);
        document.getElementById('wsx-copy-url').addEventListener('click', copyUrl);
        document.getElementById('wsx-image-upload-btn').addEventListener('click', () => document.getElementById('wsx-image-file-input').click());
        document.getElementById('wsx-image-file-input').addEventListener('change', e => uploadImages([...e.target.files]));

        const editor = document.getElementById('wsx-editor');
        editor.addEventListener('input', syncPreview);
        document.querySelectorAll('.wsx-editor-toolbar button').forEach(btn => {
            btn.addEventListener('click', () => execEditorCmd(btn.dataset.cmd));
        });

        document.getElementById('wsx-title').addEventListener('input', () => articleMeta.title = document.getElementById('wsx-title').value);
        document.getElementById('wsx-category').addEventListener('change', () => articleMeta.category = document.getElementById('wsx-category').value);

        const drop = document.getElementById('wsx-image-dropzone');
        drop.addEventListener('paste', onPaste);
        drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('is-dragover'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('is-dragover'));
        drop.addEventListener('drop', e => {
            e.preventDefault();
            drop.classList.remove('is-dragover');
            const files = [...(e.dataTransfer?.files || [])].filter(f => f.type.startsWith('image/'));
            if (files.length) uploadImages(files);
        });

        // 全局 paste 也兜底,焦点不在 dropzone 时只要在 source 步骤就接
        document.addEventListener('paste', e => {
            if (document.getElementById('wsx-step-source').hidden) return;
            const items = e.clipboardData?.items || [];
            const files = [];
            for (const it of items) {
                if (it.kind === 'file' && it.type.startsWith('image/')) {
                    const f = it.getAsFile();
                    if (f) files.push(f);
                }
            }
            if (files.length) {
                e.preventDefault();
                uploadImages(files);
            }
        });
    }

    function onPaste(e) {
        const items = e.clipboardData?.items || [];
        const files = [];
        for (const it of items) {
            if (it.kind === 'file' && it.type.startsWith('image/')) {
                const f = it.getAsFile();
                if (f) files.push(f);
            }
        }
        if (files.length) {
            e.preventDefault();
            uploadImages(files);
        }
    }

    async function uploadImages(files) {
        if (!files.length) return;
        showBusy(`上传 ${files.length} 张图...`);
        for (const file of files) {
            try {
                const entry = await window.uploadImage(file, { folder: 'news/' + new Date().toISOString().slice(0, 7) });
                images.push({ url: entry.url, label: entry.label || file.name });
            } catch (err) {
                console.error('upload failed', err);
            }
        }
        renderImageGrid();
        hideBusy();
    }

    function renderImageGrid() {
        const grid = document.getElementById('wsx-image-grid');
        grid.innerHTML = '';
        images.forEach((img, idx) => {
            const t = document.createElement('div');
            t.className = 'wsx-image-thumb';
            t.style.backgroundImage = `url('${img.url}')`;
            t.title = img.label;
            const rm = document.createElement('button');
            rm.type = 'button';
            rm.className = 'wsx-image-thumb-remove';
            rm.textContent = '×';
            rm.addEventListener('click', () => {
                images.splice(idx, 1);
                renderImageGrid();
            });
            t.appendChild(rm);
            grid.appendChild(t);
        });
    }

    async function onDraftFull() {
        const text = document.getElementById('wsx-source-text').value.trim();
        const intent = document.getElementById('wsx-intent').value.trim();
        if (!text && !images.length) {
            alert('丢一点文字或图给 AI 看,再起稿。');
            return;
        }
        lastSourceText = text;
        lastIntent = intent;
        showBusy('AI 起稿中... DeepSeek 自动判分类 + 选模板 + 出整篇');
        try {
            const r = await window.api(DRAFT_FULL_API, {
                method: 'POST',
                body: JSON.stringify({
                    source_text: text,
                    images: images.map(i => i.url),
                    intent,
                }),
            });
            articleMeta = {
                id: autoId(),
                template_id: r.template_used || '',
                category: r.category || 'case',
                category_label: r.category_label || '',
                title: r.title || '',
                summary: r.summary || '',
            };
            applyDraftToEditor(r);
        } catch (err) {
            alert('AI 起稿失败: ' + err.message);
        } finally {
            hideBusy();
        }
    }

    function applyDraftToEditor(r) {
        document.getElementById('wsx-title').value = r.title || '';
        if (r.category) document.getElementById('wsx-category').value = r.category;
        document.getElementById('wsx-editor').innerHTML = r.html || '';
        document.getElementById('wsx-step-editor').hidden = false;
        document.getElementById('wsx-step-publish').hidden = false;
        document.getElementById('wsx-editor-meta').textContent =
            r.template_used ? `AI 选了模板: ${r.template_used}` : '';
        syncPreview();
        document.getElementById('wsx-step-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function onRevise() {
        const inst = document.getElementById('wsx-revise-instruction').value.trim();
        if (!inst) { alert('写一行修订指令,例: 标题再亮点 / 第二段再短一点'); return; }
        const currentHtml = document.getElementById('wsx-editor').innerHTML;
        if (!currentHtml.trim()) { alert('先让 AI 起稿,再来调。'); return; }
        showBusy('AI 修订中... 基于你的指令重写');
        try {
            const r = await window.api(REVISE_API, {
                method: 'POST',
                body: JSON.stringify({
                    current_html: currentHtml,
                    instruction: inst,
                    title: articleMeta.title || document.getElementById('wsx-title').value,
                    category: articleMeta.category || document.getElementById('wsx-category').value,
                }),
            });
            if (r.title) {
                document.getElementById('wsx-title').value = r.title;
                articleMeta.title = r.title;
            }
            if (r.summary) articleMeta.summary = r.summary;
            document.getElementById('wsx-editor').innerHTML = r.html || currentHtml;
            document.getElementById('wsx-revise-instruction').value = '';
            syncPreview();
        } catch (err) {
            alert('AI 修订失败: ' + err.message);
        } finally {
            hideBusy();
        }
    }

    function execEditorCmd(cmd) {
        const editor = document.getElementById('wsx-editor');
        editor.focus();
        switch (cmd) {
            case 'bold':
            case 'italic':
            case 'undo':
            case 'redo':
            case 'insertUnorderedList':
                document.execCommand(cmd, false, null);
                break;
            case 'ul':
                document.execCommand('insertUnorderedList', false, null);
                break;
            case 'h2':
            case 'h3':
            case 'p':
            case 'blockquote':
                document.execCommand('formatBlock', false, cmd);
                break;
        }
        syncPreview();
    }

    function syncPreview() {
        const frame = document.getElementById('wsx-preview-frame');
        const html = document.getElementById('wsx-editor').innerHTML;
        if (!html.trim()) {
            frame.innerHTML = '<div class="wsx-preview-empty">丢素材 → AI 起稿后, 渲染出现在这。</div>';
            return;
        }
        try {
            const safe = window.DOMPurify ? window.DOMPurify.sanitize(html, { ADD_ATTR: ['target'] }) : html;
            frame.innerHTML = `<section class="wsx-article">${safe}</section>`;
        } catch (err) {
            frame.innerHTML = `<div class="wsx-preview-empty">预览出错: ${err.message}</div>`;
        }
    }

    async function savePublish(draft) {
        const title = document.getElementById('wsx-title').value.trim();
        const html = document.getElementById('wsx-editor').innerHTML.trim();
        if (!title) { alert('标题不能空。'); return; }
        if (!html) { alert('正文不能空,先让 AI 起稿。'); return; }
        const id = articleMeta.id || autoId();
        const cat = document.getElementById('wsx-category').value;
        const date = document.getElementById('wsx-date').value || new Date().toISOString().slice(0, 10);
        const cover = images[0]?.url || '';
        const payload = {
            id,
            template_id: articleMeta.template_id || 'ai-freeform',
            category: cat,
            category_label: catLabel(cat),
            date,
            title,
            summary: articleMeta.summary || '',
            cover,
            body: html,
            mode: 'ai',
            draft: !!draft,
            source_text: lastSourceText,
            intent: lastIntent,
            images: images.map(i => i.url),
        };
        try {
            const r = await window.api(SAVE_API, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (draft) {
                alert('草稿已保存。');
                articleMeta.id = id;
            } else {
                openSuccessModal(r.public_url);
            }
        } catch (err) {
            alert('保存失败: ' + err.message);
        }
    }

    function autoId() {
        const d = new Date().toISOString().slice(0, 10);
        const rand = Math.random().toString(36).slice(2, 7);
        return `orig-${d}-${rand}`;
    }

    function catLabel(cat) {
        return {
            case: '客户案例', company: '公司动态', gov: '党政动态',
            product: '产品介绍', tech: '技术小知识', insight: '老板视角',
        }[cat] || cat;
    }

    function showBusy(msg) {
        document.getElementById('wsx-busy-msg').textContent = msg || 'AI 工作中...';
        document.getElementById('wsx-busy').hidden = false;
    }
    function hideBusy() { document.getElementById('wsx-busy').hidden = true; }

    function openSuccessModal(url) {
        document.getElementById('wsx-published-url').value = url;
        document.getElementById('wsx-open-public').href = url;
        document.getElementById('wsx-success-modal').hidden = false;
    }
    function closeSuccessModal() { document.getElementById('wsx-success-modal').hidden = true; }
    function copyUrl() {
        const input = document.getElementById('wsx-published-url');
        input.select();
        document.execCommand('copy');
        const btn = document.getElementById('wsx-copy-url');
        const orig = btn.textContent;
        btn.textContent = '✓ 已复制';
        setTimeout(() => btn.textContent = orig, 1600);
    }

    async function openLoadDraft() {
        try {
            const list = await window.api(DRAFTS_API);
            if (!list.length) { alert('暂无草稿。'); return; }
            const lines = list.map((d, i) => `${i + 1}. ${d.id} · ${d.date} · ${d.title || '(无标题)'}`).join('\n');
            const choice = prompt('选一个草稿编号载入:\n\n' + lines, '1');
            const idx = parseInt(choice, 10) - 1;
            if (isNaN(idx) || idx < 0 || idx >= list.length) return;
            const d = list[idx];
            articleMeta = {
                id: d.id,
                template_id: d.template_id || 'ai-freeform',
                category: d.category,
                title: d.title || '',
                summary: d.summary || '',
            };
            document.getElementById('wsx-title').value = d.title || '';
            document.getElementById('wsx-category').value = d.category || 'case';
            document.getElementById('wsx-date').value = d.date || new Date().toISOString().slice(0, 10);
            document.getElementById('wsx-editor').innerHTML = d.body || '';
            document.getElementById('wsx-source-text').value = d.source_text || '';
            document.getElementById('wsx-intent').value = d.intent || '';
            images = (d.images || []).map(u => ({ url: u, label: '' }));
            renderImageGrid();
            document.getElementById('wsx-step-editor').hidden = false;
            document.getElementById('wsx-step-publish').hidden = false;
            syncPreview();
        } catch (err) {
            alert('载入失败: ' + err.message);
        }
    }
})();
