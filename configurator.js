// ============================================
// 高级选配器 — 粒子系统 + 交互逻辑
// ============================================

// ====== 粒子系统 ======
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animId;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
    constructor(type) {
        this.type = type || 'flow'; // 'flow' = 流动光子, 'star' = 星光
        this.reset();
    }
    reset() {
        if (this.type === 'star') {
            // 星光：固定位置，闪烁，多种颜色和大小
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height * 0.85;
            var rand = Math.random();
            this.size = rand < 0.1 ? Math.random() * 2.5 + 1.5  // 10% 大星
                      : rand < 0.4 ? Math.random() * 1.2 + 0.5  // 30% 中星
                      : Math.random() * 0.8 + 0.2;               // 60% 小星
            this.speedX = 0;
            this.speedY = 0;
            this.opacity = this.size > 1.5 ? Math.random() * 0.7 + 0.3
                         : Math.random() * 0.5 + 0.1;
            this.twinkleSpeed = Math.random() * 0.04 + 0.005;
            this.twinklePhase = Math.random() * Math.PI * 2;
            var colorRand = Math.random();
            this.color = colorRand < 0.35 ? `rgba(200, 225, 255, ALPHA)`  // 冷白星
                       : colorRand < 0.65 ? `rgba(120, 175, 255, ALPHA)`  // 淡蓝星
                       : colorRand < 0.85 ? `rgba(60, 130, 245, ALPHA)`   // 中蓝星
                       : `rgba(30, 90, 220, ALPHA)`;                       // 深蓝星
            this.life = Infinity;
            this.age = 0;
        } else {
            // 流动光子
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.7) * 1.2;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.4 + 0.1;
            var cr = Math.random();
            this.color = cr < 0.5 ? `rgba(60, 140, 255, ALPHA)`
                       : cr < 0.8 ? `rgba(30, 100, 235, ALPHA)`
                       : `rgba(100, 180, 255, ALPHA)`;
            this.life = Math.random() * 200 + 100;
            this.age = 0;
        }
    }
    update() {
        this.age++;
        if (this.type === 'star') {
            // 星光闪烁
            this.twinklePhase += this.twinkleSpeed;
        } else {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.age > this.life || this.x < -50 || this.x > canvas.width + 50) {
                this.reset();
                this.x = canvas.width + 20;
            }
        }
    }
    draw() {
        let alpha;
        if (this.type === 'star') {
            alpha = this.opacity * (0.3 + 0.7 * Math.abs(Math.sin(this.twinklePhase)));
        } else {
            const fade = 1 - (this.age / this.life);
            alpha = fade * this.opacity;
        }
        const color = this.color.replace('ALPHA', alpha.toFixed(3));

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // 大星星外发光
        if (this.type === 'star' && this.size > 1.2) {
            var glowSize = this.size * 6;
            var grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
            grd.addColorStop(0, this.color.replace('ALPHA', (alpha * 0.25).toFixed(3)));
            grd.addColorStop(1, this.color.replace('ALPHA', '0'));
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
        }

        // 星光十字光芒
        if (this.type === 'star' && this.size > 0.8) {
            const len = this.size * 5 * alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = this.size > 1.5 ? 1 : 0.5;
            ctx.beginPath();
            ctx.moveTo(this.x - len, this.y);
            ctx.lineTo(this.x + len, this.y);
            ctx.moveTo(this.x, this.y - len);
            ctx.lineTo(this.x, this.y + len);
            ctx.stroke();
        }

        // 流动光子拖尾
        if (this.type === 'flow' && this.size > 1) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.speedX * 8, this.y + this.speedY * 8);
            ctx.strokeStyle = this.color.replace('ALPHA', (alpha * 0.3).toFixed(3));
            ctx.lineWidth = this.size * 0.5;
            ctx.stroke();
        }
    }
}

// 初始化粒子：密集星光 + 流动光子
for (let i = 0; i < 150; i++) {
    particles.push(new Particle('star'));
}
for (let i = 0; i < 25; i++) {
    particles.push(new Particle('flow'));
}

// ====== 鼠标流光粒子 ======
var mouseTrail = [];
var mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    // 每次移动生成1-2个流光粒子
    for (var i = 0; i < 2; i++) {
        mouseTrail.push({
            x: mouseX + (Math.random() - 0.5) * 10,
            y: mouseY + (Math.random() - 0.5) * 10,
            size: Math.random() * 2.5 + 0.5,
            speedX: (Math.random() - 0.5) * 2,
            speedY: (Math.random() - 0.5) * 2 - 0.5,
            life: 40 + Math.random() * 30,
            age: 0,
            color: Math.random() > 0.5 ? [80, 160, 255] : [40, 120, 245]
        });
    }
    // 限制总数
    if (mouseTrail.length > 80) mouseTrail.splice(0, mouseTrail.length - 80);
});

function drawMouseTrail() {
    for (var i = mouseTrail.length - 1; i >= 0; i--) {
        var p = mouseTrail[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedX *= 0.96;
        p.speedY *= 0.96;
        p.age++;
        if (p.age > p.life) { mouseTrail.splice(i, 1); continue; }

        var fade = 1 - p.age / p.life;
        var alpha = fade * 0.6;
        var r = p.color[0], g = p.color[1], b = p.color[2];

        // 发光圆点
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * fade, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        ctx.fill();

        // 外发光
        if (p.size > 1) {
            var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4 * fade);
            grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha * 0.3) + ')');
            grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4 * fade, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }
    }
}

// ====== 流星/流光系统 ======
var shootingStars = [];
var shootingTimer = 0;

function spawnShootingStar() {
    shootingStars.push({
        x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
        y: -10,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 4 + 3,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3, // 大致45度向右下
        opacity: Math.random() * 0.5 + 0.4,
        width: Math.random() * 1.5 + 0.5,
        life: 100 + Math.random() * 60,
        age: 0,
        color: Math.random() > 0.5 ? [100, 170, 255] : [150, 200, 255]
    });
}

function drawShootingStars() {
    shootingTimer++;
    // 每60-120帧生成一颗流星
    if (shootingTimer > 60 + Math.random() * 80) {
        spawnShootingStar();
        shootingTimer = 0;
    }

    for (var i = shootingStars.length - 1; i >= 0; i--) {
        var s = shootingStars[i];
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.age++;

        if (s.age > s.life || s.x > canvas.width + 50 || s.y > canvas.height + 50) {
            shootingStars.splice(i, 1);
            continue;
        }

        var fade = s.age < 15 ? s.age / 15 : (1 - (s.age - 15) / (s.life - 15));
        fade = Math.max(0, fade);
        var alpha = fade * s.opacity;
        var r = s.color[0], g = s.color[1], b = s.color[2];

        // 流星尾巴（渐变线）
        var tailX = s.x - Math.cos(s.angle) * s.length;
        var tailY = s.y - Math.sin(s.angle) * s.length;

        var grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')');
        grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.stroke();

        // 流星头部发光
        var headGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 4);
        headGlow.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha * 0.8) + ')');
        headGlow.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = headGlow;
        ctx.fill();
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    drawShootingStars();
    drawMouseTrail();
    animId = requestAnimationFrame(animateParticles);
}
animateParticles();

// ====== 选配器逻辑 ======
const TOTAL_STEPS = 5;
let currentStep = 0;

const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnSubmit = document.getElementById('btnSubmit');
const vehicleImg = document.getElementById('vehicleImg');
const reflectionImg = document.getElementById('reflectionImg');
const vehicleLabel = document.getElementById('vehicleLabel');
const vehicleWrapper = document.getElementById('vehicleWrapper');

const typeImages = {
    '直梁平板': 'assets/images/config-base.png',
    '高低平板': 'assets/images/product-lowbed.jpg',
    '自卸': 'assets/images/product-dump.jpg',
    '骨架': 'assets/images/product-crane.jpg',
    '仓栅': 'assets/images/product-fence.jpg',
    '特种': 'assets/images/product-special.jpg'
};

// 颜色 → CSS滤镜映射（基于红色基础图，hue≈0°）
// 红色是原色，其他颜色从红色出发偏移
const colorFilters = {
    '聚德大红 RAL3020':   'none',  // 基础色！
    '赤焰红 RAL3000':     'brightness(0.8) contrast(1.1)',
    '桔红 RAL2017':        'hue-rotate(20deg) saturate(1.3) brightness(1.05)',
    '聚德黄色 RAL1007':   'hue-rotate(45deg) saturate(1.5) brightness(1.15)',
    '白色 RAL9016':        'saturate(0.05) brightness(1.8) contrast(0.85)',
    '银灰 RAL7040':        'saturate(0.08) brightness(1.1) contrast(1.05)',
    '淡蓝色 RAL5012':     'hue-rotate(200deg) saturate(1.2) brightness(1.0)',
    '东岳蓝 RAL5002':     'hue-rotate(230deg) saturate(1.5) brightness(0.6) contrast(1.1)',
    '苹果绿 RAL6016':     'hue-rotate(140deg) saturate(0.9) brightness(0.7) contrast(1.1)',
    '黑色 RAL9005':        'saturate(0.05) brightness(0.3) contrast(1.5)',
    '其他':                'none'
};

const DEFAULT_COLOR = '聚德大红 RAL3020';

const typeLabels = {
    '直梁平板': { en: 'FLATBED SEMI-TRAILER', zh: '平板半挂车' },
    '高低平板': { en: 'LOW-BED SEMI-TRAILER', zh: '高低平板半挂车' },
    '自卸': { en: 'DUMP SEMI-TRAILER', zh: '自卸半挂车' },
    '骨架': { en: 'SKELETON TRAILER', zh: '骨架车' },
    '仓栅': { en: 'FENCE SEMI-TRAILER', zh: '仓栅半挂车' },
    '特种': { en: 'SPECIAL VEHICLE', zh: '特种车' }
};

// ====== 步骤切换 ======
function goToStep(step) {
    if (step < 0 || step >= TOTAL_STEPS) return;

    document.querySelectorAll('.config-step').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.step-dot').forEach(el => {
        el.classList.remove('active');
        if (parseInt(el.dataset.step) < step) el.classList.add('done');
        else el.classList.remove('done');
    });

    document.querySelector(`.config-step[data-step="${step}"]`).classList.add('active');
    document.querySelector(`.step-dot[data-step="${step}"]`).classList.add('active');

    currentStep = step;
    btnPrev.disabled = step === 0;

    if (step === TOTAL_STEPS - 1) {
        btnNext.classList.add('hidden');
        btnSubmit.classList.remove('hidden');
        buildSummary();
    } else {
        btnNext.classList.remove('hidden');
        btnSubmit.classList.add('hidden');
    }
}

btnPrev.addEventListener('click', () => goToStep(currentStep - 1));
btnNext.addEventListener('click', () => goToStep(currentStep + 1));

document.querySelectorAll('.step-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        const step = parseInt(dot.dataset.step);
        if (step <= currentStep + 1) goToStep(step);
    });
});

// ====== 车型切换动画 ======
document.querySelectorAll('input[name="vehicleType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const type = e.target.value;
        const src = typeImages[type];
        const label = typeLabels[type];

        // 驶出 + 驶入动画
        vehicleWrapper.style.animation = 'none';
        vehicleWrapper.offsetHeight; // reflow
        vehicleWrapper.style.animation = 'driveIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) both';

        setTimeout(() => {
            vehicleImg.src = src;
            reflectionImg.src = src;
            vehicleLabel.querySelector('.label-en').textContent = label.en;
            vehicleLabel.querySelector('.label-zh').textContent = label.zh;
        }, 150);

        updateTags();
    });
});

// ====== 颜色切换 — CSS滤镜变色 ======
function setVehicleColor(colorVal) {
    var filters = {
        '聚德大红 RAL3020':   'none',
        '赤焰红 RAL3000':     'brightness(0.8) contrast(1.1)',
        '桔红 RAL2017':        'hue-rotate(20deg) saturate(1.3) brightness(1.05)',
        '聚德黄色 RAL1007':   'hue-rotate(45deg) saturate(1.5) brightness(1.15)',
        '白色 RAL9016':        'grayscale(1) brightness(2.8) contrast(0.6)',
        '银灰 RAL7040':        'grayscale(1) brightness(1.4) contrast(0.9)',
        '淡蓝色 RAL5012':     'hue-rotate(200deg) saturate(1.2) brightness(1.0)',
        '东岳蓝 RAL5002':     'hue-rotate(230deg) saturate(1.5) brightness(0.6) contrast(1.1)',
        '苹果绿 RAL6016':     'hue-rotate(140deg) saturate(0.9) brightness(0.7) contrast(1.1)',
        '黑色 RAL9005':        'saturate(0.05) brightness(0.3) contrast(1.5)'
    };
    var f = filters[colorVal] || 'none';
    var vImg = document.getElementById('vehicleImg');
    var rImg = document.getElementById('reflectionImg');
    if (vImg) vImg.style.filter = 'drop-shadow(0 20px 60px rgba(37,99,235,0.15)) ' + f;
    if (rImg) rImg.style.filter = 'blur(3px) ' + f;
}

// 绑定颜色事件
document.querySelectorAll('input[name="color"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
        setVehicleColor(radio.value);
        var vImg = document.getElementById('vehicleImg');
        if (vImg) {
            vImg.style.transform = 'scale(1.02)';
            setTimeout(function() { vImg.style.transform = 'scale(1)'; }, 300);
        }
        updateTags();
    });
});

// ====== 所有选项变化 ======
document.querySelectorAll('input[type="radio"]').forEach(radio => {
    if (radio.name !== 'color') {
        radio.addEventListener('change', updateTags);
    }
});

document.querySelectorAll('input[name="length"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const el = document.getElementById('customLength');
        if (e.target.value === '其他') { el.classList.remove('hidden'); el.focus(); }
        else el.classList.add('hidden');
    });
});

function updateTags() {
    const s = getSelections();
    const tags = [];
    if (s.vehicleType) tags.push(typeLabels[s.vehicleType]?.zh || s.vehicleType);
    if (s.length) tags.push(s.length);
    if (s.axles) tags.push(s.axles);
    if (s.suspension) tags.push(s.suspension);
    if (s.color) tags.push(s.color.split(' ')[0]);
    if (tags.length === 0) tags.push('请选择配置');

    document.getElementById('configTags').innerHTML =
        tags.map(t => `<span class="tag">${t}</span>`).join('');
}

function getSelections() {
    const get = (name) => {
        const el = document.querySelector(`input[name="${name}"]:checked`);
        return el ? el.value : '';
    };
    let length = get('length');
    if (length === '其他') {
        const custom = document.getElementById('customLength').value;
        if (custom) length = custom;
    }
    return {
        vehicleType: get('vehicleType'),
        length, axles: get('axles'), leg: get('leg'),
        webPlate: get('webPlate'), suspension: get('suspension'),
        tire: get('tire'), hub: get('hub'), axleBrand: get('axleBrand'),
        color: get('color'),
        remarks: document.querySelector('textarea[name="remarks"]')?.value || '',
        customerName: document.querySelector('input[name="customerName"]')?.value || '',
        customerPhone: document.querySelector('input[name="customerPhone"]')?.value || '',
        customerCompany: document.querySelector('input[name="customerCompany"]')?.value || '',
        quantity: get('quantity')
    };
}

function buildSummary() {
    const s = getSelections();
    const label = typeLabels[s.vehicleType]?.zh || s.vehicleType || '未选择';
    const rows = [
        ['车型', label], ['车身长度', s.length || '未选择'],
        ['轴数', s.axles || '未选择'], ['支腿', s.leg || '未选择'],
        ['腹板厚度', s.webPlate || '未选择'], ['悬挂系统', s.suspension || '未选择'],
        ['轮胎规格', s.tire || '未选择'], ['轮毂', s.hub || '未选择'],
        ['车桥', s.axleBrand || '未选择'], ['车身颜色', s.color?.split(' ')[0] || '未选择'],
    ];
    if (s.remarks) rows.push(['特殊需求', s.remarks]);

    document.getElementById('configSummary').innerHTML = `
        <h3>CONFIG SUMMARY</h3>
        ${rows.map(([l, v]) => `<div class="summary-row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('')}
    `;
}

// ====== 提交 ======
btnSubmit.addEventListener('click', () => {
    const s = getSelections();
    if (!s.customerName.trim()) { alert('请输入您的称呼'); return; }
    if (!s.customerPhone.trim() || !/^1\d{10}$/.test(s.customerPhone.trim())) {
        alert('请输入正确的手机号'); return;
    }
    console.log('提交询价:', JSON.stringify(s, null, 2));
    document.getElementById('successModal').classList.remove('hidden');
});

// 初始化 — 红色是基础图原色，不需要滤镜
updateTags();
