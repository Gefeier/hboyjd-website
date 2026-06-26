// ====== Hero 视频延迟加载 ======
// 首屏立刻显示 poster,等页面 load 完后再下载视频,避免阻塞首屏
window.addEventListener('load', () => {
    const video = document.querySelector('.hero-video');
    if (!video || !video.dataset.src) return;
    // 移动端 .hero-video display:none,跳过加载
    if (getComputedStyle(video).display === 'none') return;
    const source = document.createElement('source');
    source.src = video.dataset.src;
    source.type = 'video/mp4';
    video.appendChild(source);
    video.load();
    // autoplay 浏览器策略:muted+playsinline 一般允许自动播放
    const playPromise = video.play();
    if (playPromise) playPromise.catch(() => { /* 用户手动触发 */ });
});

// ====== 导航栏滚动效果 ======
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ====== 数字动画 ======
function animateNumbers() {
    const numbers = document.querySelectorAll('.stat-number[data-target]');
    numbers.forEach(el => {
        const target = parseInt(el.dataset.target);
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(target * eased);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

// ====== 滚动触发动画 ======
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.target.classList.contains('stats')) {
                animateNumbers();
            }
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.stats, .about, .products, .advantages, .news, .cta-section, .contact').forEach(el => {
    observer.observe(el);
});

// ====== 关于我们轮播 ======
(function() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    if (!slides.length) return;

    let current = 0;
    let timer;

    function goTo(index) {
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = ((index % slides.length) + slides.length) % slides.length;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
    }

    function resetAuto() {
        clearInterval(timer);
        timer = setInterval(() => goTo(current + 1), 4000);
    }

    prevBtn?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
    nextBtn?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            goTo(parseInt(dot.dataset.index));
            resetAuto();
        });
    });

    resetAuto();
})();

// ====== 新闻动态 ======
(function() {
    const container = document.getElementById('newsColumns');
    if (!container) return;

    const categories = [
        { key: 'gov', zh: '党政动态', en: 'Government & Party' },
        { key: 'company', zh: '公司动态', en: 'Company News' },
        { key: 'case', zh: '客户案例', en: 'Customer Stories' }
    ];

    let allNews = [];

    // 加时间戳破缓存,新闻栏内容由公众号自动同步,客户首次/刷新都拿最新
    fetch('news.json?t=' + Date.now())
        .then(r => r.json())
        .then(data => {
            // 过滤掉 site_visible:false(市场部标记不上官网的:价格喊话/内部梗/抽奖大促)
            allNews = data
                .filter(n => n.site_visible !== false)
                .sort((a, b) => b.date.localeCompare(a.date));
            render();
        })
        .catch(() => {});

    function render() {
        const isEn = document.documentElement.lang === 'en';
        const PER_COL = 5;  // 首页每列只展示最近 5 条;完整列表跳 news.html
        container.innerHTML = categories.map(cat => {
            const items = allNews.filter(n => n.category === cat.key).slice(0, PER_COL);
            const totalForCat = allNews.filter(n => n.category === cat.key).length;
            const listHTML = items.length > 0
                ? `<ul class="news-list">${items.map(n => `
                    <li><a href="${n.url || '#'}" data-news-id="${n.id || ''}" class="news-link">
                        <span class="news-dot"></span>
                        <span class="news-title">${isEn ? n.title_en || n.title : n.title}</span>
                        <span class="news-date">${n.date}</span>
                    </a></li>`).join('')}</ul>`
                : `<div class="news-column-empty">${isEn ? 'Coming soon' : '即将更新'}</div>`;

            const moreHTML = totalForCat > PER_COL
                ? `<div class="news-column-more"><a href="news.html?cat=${cat.key}">${isEn ? `View all ${totalForCat} →` : `查看全部 ${totalForCat} 条 →`}</a></div>`
                : '';

            return `<div>
                <div class="news-column-header">
                    <h3>${isEn ? cat.en : cat.zh}</h3>
                </div>
                ${listHTML}
                ${moreHTML}
            </div>`;
        }).join('');

        // 绑定 news-link → 拦截 → 打开 lightbox(原创文章直接跳站内详情页,不弹 lightbox)
        container.querySelectorAll('.news-link').forEach(a => {
            a.addEventListener('click', (e) => {
                const id = a.dataset.newsId;
                const news = allNews.find(n => n.id === id);
                if (!news || !news.url) return;  // 没 url 就让默认 # 跳
                // 原创文章 url 已是 /news-detail.html?id=...,让默认 <a href> 跳走即可
                if (news.source === 'original') return;
                e.preventDefault();
                openNewsLightbox(news, isEn);
            });
        });
    }

    function openNewsLightbox(news, isEn) {
        const title = isEn ? (news.title_en || news.title) : news.title;
        const summary = isEn ? (news.summary_en || news.summary) : news.summary;
        const cover = news.cover ? `<div class="news-lb-cover" style="background-image:url('${news.cover}')"></div>` : '';
        const lb = document.createElement('div');
        lb.className = 'news-lightbox';
        lb.innerHTML = `
            <div class="news-lb-backdrop"></div>
            <div class="news-lb-card" role="dialog" aria-label="${title}">
                <button class="news-lb-close" type="button" aria-label="关闭">×</button>
                ${cover}
                <div class="news-lb-body">
                    <div class="news-lb-meta">
                        <span class="news-lb-cat">${news.category_label || ''}</span>
                        <span class="news-lb-date">${news.date}</span>
                    </div>
                    <h3 class="news-lb-title">${title}</h3>
                    ${summary ? `<p class="news-lb-summary">${summary}</p>` : ''}
                    <div class="news-lb-actions">
                        <a href="${news.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                            ${isEn ? 'Read Full Article →' : '阅读全文(公众号)→'}
                        </a>
                        <button type="button" class="btn btn-outline news-lb-cancel">
                            ${isEn ? 'Close' : '关闭'}
                        </button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(lb);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => lb.classList.add('is-open'));

        const close = () => {
            lb.classList.remove('is-open');
            setTimeout(() => { lb.remove(); document.body.style.overflow = ''; }, 240);
        };
        lb.querySelector('.news-lb-close').addEventListener('click', close);
        lb.querySelector('.news-lb-cancel').addEventListener('click', close);
        lb.querySelector('.news-lb-backdrop').addEventListener('click', close);
        document.addEventListener('keydown', function esc(ev) {
            if (ev.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
        });
    }

    // 语言切换时重新渲染
    document.getElementById('langToggle')?.addEventListener('click', () => {
        setTimeout(render, 50);
    });
})();

// ====== 表单提交 ======
document.getElementById('inquiryForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('感谢您的咨询！我们的销售人员将尽快与您联系。');
    this.reset();
});

// ====== 移动端导航(汉堡菜单滑下) ======
(function() {
    const toggle = document.getElementById('navToggle');
    const links = document.querySelector('.nav-links');
    const navbar = document.querySelector('.navbar');
    if (!toggle || !links || !navbar) return;

    // 清掉历史 inline style 残留(老版 main.js 留的)
    links.style.removeProperty('display');

    function close() {
        navbar.classList.remove('mobile-open');
        document.body.classList.remove('nav-locked');
        toggle.setAttribute('aria-expanded', 'false');
        // 兜底:某些情况下 CSS class 切换不生效,直接 inline 控制 transform
        if (window.innerWidth <= 1023) {
            links.style.setProperty('transform', 'translateX(100%)', 'important');
        } else {
            links.style.removeProperty('transform');
        }
    }
    function open() {
        navbar.classList.add('mobile-open');
        document.body.classList.add('nav-locked');
        toggle.setAttribute('aria-expanded', 'true');
        if (window.innerWidth <= 1023) {
            links.style.setProperty('transform', 'translateX(0)', 'important');
        }
    }

    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        navbar.classList.contains('mobile-open') ? close() : open();
    });

    // 点击菜单内任何链接 → 关闭抽屉
    links.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') close();
    });

    // 点击抽屉外部 → 关闭
    document.addEventListener('click', function(e) {
        if (navbar.classList.contains('mobile-open') && !navbar.contains(e.target)) close();
    });

    // viewport 拉宽到桌面 → 关闭(避免状态残留)
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1023) close();
    });
})();

// ====== 中英文切换 ======
(function() {
    const langToggle = document.getElementById('langToggle');
    if (!langToggle) return;

    let currentLang = 'zh';

    langToggle.addEventListener('click', function() {
        currentLang = currentLang === 'zh' ? 'en' : 'zh';

        // 切换按钮高亮
        langToggle.querySelector('.lang-zh').classList.toggle('active', currentLang === 'zh');
        langToggle.querySelector('.lang-en').classList.toggle('active', currentLang === 'en');

        // 更新html lang属性
        document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';

        // 切换所有带 data-en 的文本元素
        document.querySelectorAll('[data-en]').forEach(el => {
            if (!el.dataset.zh) {
                el.dataset.zh = el.textContent;
            }
            el.textContent = currentLang === 'en' ? el.dataset.en : el.dataset.zh;
        });

        // 切换 placeholder
        document.querySelectorAll('[data-en-placeholder]').forEach(el => {
            if (!el.dataset.zhPlaceholder) {
                el.dataset.zhPlaceholder = el.placeholder;
            }
            el.placeholder = currentLang === 'en' ? el.dataset.enPlaceholder : el.dataset.zhPlaceholder;
        });

        // 切换 select 第一个 option 和其他 option
        document.querySelectorAll('select[data-en-first]').forEach(sel => {
            const firstOpt = sel.options[0];
            if (!firstOpt.dataset.zh) {
                firstOpt.dataset.zh = firstOpt.textContent;
            }
            firstOpt.textContent = currentLang === 'en' ? sel.dataset.enFirst : firstOpt.dataset.zh;

            // 其余 option
            for (let i = 1; i < sel.options.length; i++) {
                const opt = sel.options[i];
                if (opt.dataset.en) {
                    if (!opt.dataset.zh) opt.dataset.zh = opt.textContent;
                    opt.textContent = currentLang === 'en' ? opt.dataset.en : opt.dataset.zh;
                }
            }
        });

        // 切换页面标题
        document.title = currentLang === 'en'
            ? 'Hubei Ouyang Jude Automobile | Semi-Trailer Expert'
            : '湖北欧阳聚德汽车有限公司 | 半挂车研发制造专家';
    });
})();

/* ====== 滚动渐显:IntersectionObserver fade-up,带 stagger ====== */
(function () {
    if (!('IntersectionObserver' in window)) return;

    const selectors = [
        '.stat-item',
        '.timeline-item',
        '.tech-card',
        '.member-block',
        '.advantage-block',
        '.market-block',
        '.contribution-block',
        '.honor-figure',
        '.ft-tile',
        '.pp-card',
        '.trinity-item',
        '.section-header',
        '.about-carousel',
        '.about-content',
        '.advantage-card',
        '.news-column',
        '.mission-text',
        '.mission-tags',
        '.cta-content'
    ];
    const els = document.querySelectorAll(selectors.join(','));
    els.forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            // stagger:同父级内的兄弟元素错峰 60ms,上限 8 个
            const parent = entry.target.parentElement;
            const siblings = parent ? [...parent.children].filter((c) => c.classList.contains('reveal')) : [];
            const idx = siblings.indexOf(entry.target);
            const delay = idx >= 0 ? Math.min(idx, 8) * 60 : 0;
            setTimeout(() => entry.target.classList.add('is-visible'), delay);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach((el) => observer.observe(el));
})();

// ====== 车型详情 marquee v4 (2026-06-17) · 静态复制不用 cloneNode + 整数累加自走 + prev/next ======
(function initModelsMarqueeV4() {
    var scroll = document.querySelector('.models-marquee');
    var track = document.getElementById('modelsTrack');
    if (!scroll || !track) return;
    var prevBtn = document.getElementById('modelsPrev');
    var nextBtn = document.getElementById('modelsNext');

    function cardStep() {
        var card = track.querySelector('.m-card');
        if (!card) return 340;
        var gap = parseInt(getComputedStyle(track).gap) || 20;
        return card.offsetWidth + gap;
    }

    // seamless loop: 滚到副本起点(原始一半 cards 总宽)时瞬间跳回原始起点
    // 用 cards-only 宽度而不是 track.scrollWidth(后者含两侧 padding,大视口下 max scrollLeft 到不了 halfWidth 会卡边界)
    function checkLoop() {
        var cards = track.querySelectorAll('.m-card');
        if (cards.length < 2) return;
        var halfCount = cards.length / 2;
        var halfWidth = cardStep() * halfCount;
        if (scroll.scrollLeft >= halfWidth) scroll.scrollLeft -= halfWidth;
        else if (scroll.scrollLeft < 0) scroll.scrollLeft += halfWidth;
    }

    // 自走 · 每秒 30px 整数累加防浮点丢精度
    var PX_PER_SEC = 30;
    var paused = false;
    var lastTs = 0;
    var driftAccum = 0;
    function tick(ts) {
        if (!lastTs) { lastTs = ts; requestAnimationFrame(tick); return; }
        var dt = ts - lastTs;
        lastTs = ts;
        if (!paused && dt > 0 && dt < 100) {
            driftAccum += PX_PER_SEC * (dt / 1000);
            var step = Math.floor(driftAccum);
            if (step >= 1) {
                scroll.scrollLeft += step;
                driftAccum -= step;
                checkLoop();
            }
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // 暂停触发
    scroll.addEventListener('mouseenter', function () { paused = true; });
    scroll.addEventListener('mouseleave', function () { paused = false; lastTs = 0; });
    scroll.addEventListener('touchstart', function () { paused = true; }, { passive: true });
    scroll.addEventListener('touchend', function () {
        setTimeout(function () { paused = false; lastTs = 0; }, 2000);
    });

    // prev/next 按钮(暂停 3 秒后恢复自走)
    function manualNudge(dir) {
        paused = true;
        scroll.scrollBy({ left: dir * cardStep(), behavior: 'smooth' });
        setTimeout(function () { paused = false; lastTs = 0; }, 3000);
    }
    if (prevBtn) prevBtn.addEventListener('click', function () { manualNudge(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { manualNudge(1); });

    // 鼠标拖拽
    var isDown = false, startX = 0, startScroll = 0;
    scroll.addEventListener('mousedown', function (e) {
        isDown = true; paused = true;
        startX = e.pageX; startScroll = scroll.scrollLeft;
    });
    window.addEventListener('mousemove', function (e) {
        if (!isDown) return;
        scroll.scrollLeft = startScroll - (e.pageX - startX);
    });
    window.addEventListener('mouseup', function () {
        if (!isDown) return;
        isDown = false;
        setTimeout(function () { paused = false; lastTs = 0; }, 1500);
    });

    // scroll 监听 seamless loop(手动 scrollBy/拖拽触发后)
    scroll.addEventListener('scroll', checkLoop, { passive: true });
})();
