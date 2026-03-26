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

document.querySelectorAll('.stats, .about, .products, .advantages, .cta-section, .contact').forEach(el => {
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
