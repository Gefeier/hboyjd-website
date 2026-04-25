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
        { key: 'industry', zh: '行业资讯', en: 'Industry News' },
        { key: 'company', zh: '公司动态', en: 'Company News' },
        { key: 'tech', zh: '技术分享', en: 'Tech Insights' }
    ];

    let allNews = [];

    // 加时间戳破缓存,新闻栏内容由公众号自动同步,客户首次/刷新都拿最新
    fetch('news.json?t=' + Date.now())
        .then(r => r.json())
        .then(data => {
            allNews = data.sort((a, b) => b.date.localeCompare(a.date));
            render();
        })
        .catch(() => {});

    function render() {
        const isEn = document.documentElement.lang === 'en';
        container.innerHTML = categories.map(cat => {
            const items = allNews.filter(n => n.category === cat.key);
            const listHTML = items.length > 0
                ? `<ul class="news-list">${items.map(n => `
                    <li><a href="${n.url || '#'}" ${n.url ? 'target="_blank"' : ''}>
                        <span class="news-dot"></span>
                        <span class="news-title">${isEn ? n.title_en : n.title}</span>
                        <span class="news-date">${n.date.slice(5)}</span>
                    </a></li>`).join('')}</ul>`
                : `<div class="news-column-empty">${isEn ? 'Coming soon' : '即将更新'}</div>`;

            return `<div>
                <div class="news-column-header">
                    <h3>${isEn ? cat.en : cat.zh}</h3>
                </div>
                ${listHTML}
            </div>`;
        }).join('');
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

// ====== 移动端导航 ======
document.getElementById('navToggle')?.addEventListener('click', function() {
    const links = document.querySelector('.nav-links');
    links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
});

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
