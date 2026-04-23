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
    '高低平板': 'assets/images/config-base-lowbed.png',
    '自卸':    'assets/images/config-base-dump.png',
    '骨架':    'assets/images/config-base-skeleton.png',
    '仓栅':    'assets/images/config-base-fence.png',
    '特种':    'assets/images/product-special.jpg'  // 特种暂用卡片图
};

// ====== 每车型规格 Schema（按车型动态渲染 Step1 / Step2） ======
const COMMON = {
    axles:      { name: 'axles',      label: '轴数',       options: ['2轴', '3轴', '4轴'] },
    suspension: { name: 'suspension', label: '悬挂系统',   options: ['普通钢板悬架', '重型钢板悬架', '空气悬挂 鼓刹', '空气悬挂 碟刹'] },
    tire:       { name: 'tire',       label: '轮胎规格',   options: ['12R22.5', '11R22.5', '295/60R22.5', '275/70R22.5'] },
    hub:        { name: 'hub',        label: '轮毂材质',   options: ['钢圈', '铝合金轮毂'] },
    axleBrand:  { name: 'axleBrand',  label: '车桥品牌',   options: ['厂标配置', '富华', '襄汽'] },
    leg:        { name: 'leg',        label: '支腿类型',   options: ['28T 单动', '28T 联动', '55T 液压', '80T 液压'] },
};

const SPEC_SCHEMA = {
    '直梁平板': {
        step1: { title: '车辆规格', groups: [
            { name: 'length',   label: '车身长度', options: ['13米', '13.75米', '14.6米', '16米', '其他'], custom: true },
            COMMON.axles, COMMON.leg,
            { name: 'webPlate', label: '腹板厚度', options: ['5mm', '6mm', '8mm', '10mm', '12mm'] },
        ]},
        step2: { title: '悬挂与轮胎', groups: [ COMMON.suspension, COMMON.tire, COMMON.hub, COMMON.axleBrand ]}
    },
    '高低平板': {
        step1: { title: '车辆规格', groups: [
            { name: 'length',     label: '车身长度', options: ['13米', '13.75米', '14.6米', '其他'], custom: true },
            { name: 'gooseneck',  label: '鹅颈高度', options: ['标准 380mm', '加高 420mm'] },
            { name: 'sinkDepth',  label: '下沉深度', options: ['0.8米', '1.0米', '1.2米'] },
            COMMON.axles, COMMON.leg,
            { name: 'ladder',     label: '爬梯', options: ['液压爬梯', '机械爬梯', '无'] },
        ]},
        step2: { title: '悬挂与轮胎', groups: [ COMMON.suspension, COMMON.tire, COMMON.hub, COMMON.axleBrand ]}
    },
    '自卸': {
        step1: { title: '厢体与液压', groups: [
            { name: 'length',    label: '厢体长度', options: ['7.8米', '8.6米', '9.6米', '其他'], custom: true },
            { name: 'tipAngle',  label: '翻转角度', options: ['50°', '55°', '60°'] },
            { name: 'cylinder',  label: '油缸规格', options: ['前顶 16吨', '前顶 20吨', '中顶 16吨'] },
            { name: 'boardMat',  label: '厢板材质', options: ['普通钢板', '锰板', '高强度钢'] },
            { name: 'rearDoor',  label: '后门类型', options: ['上翻门', '侧翻门', '双开门'] },
        ]},
        step2: { title: '悬挂与轮胎', groups: [ COMMON.axles, COMMON.suspension, COMMON.tire, COMMON.hub, COMMON.axleBrand ]}
    },
    '骨架': {
        step1: { title: '集装箱规格', groups: [
            { name: 'length',        label: '车身长度', options: ['12.5米', '13米', '14.6米', '其他'], custom: true },
            { name: 'lockCount',     label: '箱锁数量', options: ['12把', '16把', '20把'] },
            { name: 'containerType', label: '兼容箱型', options: ['20尺×1', '40尺×1', '45尺×1', '双20尺'] },
            { name: 'frontLock',     label: '前移位锁', options: ['有', '无'] },
            COMMON.leg,
        ]},
        step2: { title: '悬挂与轮胎', groups: [ COMMON.axles, COMMON.suspension, COMMON.tire, COMMON.hub, COMMON.axleBrand ]}
    },
    '仓栅': {
        step1: { title: '栏板与车厢', groups: [
            { name: 'length',        label: '车身长度', options: ['13米', '13.75米', '14.6米', '其他'], custom: true },
            { name: 'fenceHeight',   label: '栏板高度', options: ['0.6米', '0.8米', '1.2米', '1.5米'] },
            { name: 'fenceMat',      label: '栏板材质', options: ['花纹钢板', '镀锌板', '铝合金'] },
            { name: 'fenceSegments', label: '栏板段数', options: ['6段', '8段', '10段'] },
            { name: 'tarpFrame',     label: '篷布架',   options: ['有', '无'] },
            { name: 'rearDoor',      label: '尾门类型', options: ['对开尾门', '上翻尾门', '无尾门'] },
        ]},
        step2: { title: '悬挂与轮胎', groups: [ COMMON.axles, COMMON.leg, COMMON.suspension, COMMON.tire, COMMON.hub, COMMON.axleBrand ]}
    },
    '特种': {
        step1: { title: '需求描述', groups: [
            { name: 'customUsage', label: '用途说明', type: 'textarea', placeholder: '例：高空作业车、随车吊、中置轴车架、全挂车等' },
            { name: 'customLoad',  label: '载重需求', options: ['≤30吨', '30-50吨', '50-80吨', '80吨以上'] },
            { name: 'length',      label: '预计长度', options: ['8米以内', '8-12米', '12-15米', '15米以上'] },
        ]},
        step2: { title: '悬挂与轮胎（可选）', groups: [ COMMON.axles, COMMON.suspension, COMMON.tire, COMMON.hub ]}
    }
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

// ====== 动态规格渲染 ======
function renderSpecStep(stepIndex, schema, stepNumberStr) {
    const container = document.getElementById('specStep' + stepIndex);
    if (!container) return;
    let html = `<div class="step-header"><span class="step-number">${stepNumberStr}</span><h2>${schema.title}</h2></div>`;
    schema.groups.forEach(g => {
        if (g.type === 'textarea') {
            html += `<div class="config-group"><label class="group-label">${g.label}</label>`
                 + `<textarea class="text-area" name="${g.name}" placeholder="${g.placeholder || ''}"></textarea></div>`;
        } else {
            html += `<div class="config-group"><label class="group-label">${g.label}</label><div class="pill-row">`;
            g.options.forEach(opt => {
                html += `<label class="pill"><input type="radio" name="${g.name}" value="${opt}"><span>${opt}</span></label>`;
            });
            html += `</div>`;
            if (g.custom) {
                html += `<input type="text" class="text-input hidden" data-custom-for="${g.name}" placeholder="请输入自定义${g.label}">`;
            }
            html += `</div>`;
        }
    });
    container.innerHTML = html;
}

function renderSpecsForType(type) {
    const schema = SPEC_SCHEMA[type] || SPEC_SCHEMA['直梁平板'];
    renderSpecStep(1, schema.step1, '02');
    renderSpecStep(2, schema.step2, '03');
    bindDynamicFieldEvents();
}

function bindDynamicFieldEvents() {
    // 规格/悬挂区所有新渲染的 radio 和 textarea 绑定更新
    const specInputs = document.querySelectorAll(
        '#specStep1 input[type="radio"], #specStep2 input[type="radio"], ' +
        '#specStep1 textarea, #specStep2 textarea'
    );
    specInputs.forEach(el => {
        el.addEventListener('change', updateTags);
        el.addEventListener('input', updateTags);
        if (el.type === 'radio') {
            el.addEventListener('change', (e) => {
                const customInput = document.querySelector(`input[data-custom-for="${e.target.name}"]`);
                if (!customInput) return;
                if (e.target.value === '其他') {
                    customInput.classList.remove('hidden');
                    customInput.focus();
                } else {
                    customInput.classList.add('hidden');
                }
            });
        }
    });
    // 自定义输入框实时更新
    document.querySelectorAll('input[data-custom-for]').forEach(i => {
        i.addEventListener('input', updateTags);
    });
}

// ====== 车型切换动画 ======
document.querySelectorAll('input[name="vehicleType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const type = e.target.value;
        const src = typeImages[type];
        const label = typeLabels[type];
        currentType = type;

        // 驶出 + 驶入动画
        vehicleWrapper.style.animation = 'none';
        vehicleWrapper.offsetHeight; // reflow
        vehicleWrapper.style.animation = 'driveIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) both';

        setTimeout(() => {
            vehicleImg.src = src;
            reflectionImg.src = src;
            vehicleLabel.querySelector('.label-en').textContent = label.en;
            vehicleLabel.querySelector('.label-zh').textContent = label.zh;
            // 加载该车型的原始像素并应用当前颜色
            loadPixelsForType(type, function() { recolorVehicle(getCurrentColor()); });
        }, 150);

        // 重新渲染规格项
        renderSpecsForType(type);
        updateTags();
    });
});

// ====== 颜色切换 — Canvas像素级HSL换色 ======
// 目标色HSL值（只需要H和S，L从原图保留）
var colorTargets = {
    '聚德大红 RAL3020':   null,           // 原色不处理
    '赤焰红 RAL3000':     { h: 1, s: 0.75, lMul: 0.85 },
    '桔红 RAL2017':        { h: 20, s: 0.9, lMul: 1.0 },
    '聚德黄色 RAL1007':   { h: 42, s: 0.95, lMul: 1.1 },
    '白色 RAL9016':        { h: 0, s: 0.02, lMul: 1.9 },
    '银灰 RAL7040':        { h: 220, s: 0.05, lMul: 1.2 },
    '淡蓝色 RAL5012':     { h: 210, s: 0.6, lMul: 1.0 },
    '东岳蓝 RAL5002':     { h: 238, s: 0.75, lMul: 0.55 },
    '苹果绿 RAL6016':     { h: 160, s: 0.55, lMul: 0.65 },
    '黑色 RAL9005':        { h: 0, s: 0.03, lMul: 0.3 }
};

// 原始图片像素数据缓存（按车型）
var pixelCache = {};   // { '直梁平板': ImageData, ... }
var currentType = '直梁平板';
var colorCanvas = document.createElement('canvas');
var colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

// 懒加载当前车型的原始像素
function loadPixelsForType(type, cb) {
    if (pixelCache[type]) { if (cb) cb(pixelCache[type]); return; }
    var src = typeImages[type];
    // 特种或非 PNG 图不做像素缓存（不参与换色）
    if (!src || !src.endsWith('.png')) { if (cb) cb(null); return; }
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
        var c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        var cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(img, 0, 0);
        try {
            pixelCache[type] = cx.getImageData(0, 0, img.width, img.height);
            if (cb) cb(pixelCache[type]);
        } catch (e) { if (cb) cb(null); }
    };
    img.onerror = function() { if (cb) cb(null); };
    img.src = src;
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
    }
    return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
    h /= 360;
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function recolorVehicle(colorVal) {
    var target = colorTargets[colorVal];
    var vImg = document.getElementById('vehicleImg');
    var rImg = document.getElementById('reflectionImg');
    var baseSrc = typeImages[currentType];

    // 原色或无像素缓存（如特种车用卡片图）→ 直接显示原图
    if (!target || !pixelCache[currentType]) {
        vImg.src = baseSrc;
        rImg.src = baseSrc;
        vImg.style.filter = 'drop-shadow(0 20px 60px rgba(37,99,235,0.15))';
        rImg.style.filter = 'blur(3px)';
        return;
    }

    var src = pixelCache[currentType];
    colorCanvas.width = src.width;
    colorCanvas.height = src.height;
    var imgData = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
    var d = imgData.data;

    for (var i = 0; i < d.length; i += 4) {
        if (d[i+3] < 10) continue; // 跳过透明像素

        var hsl = rgbToHsl(d[i], d[i+1], d[i+2]);
        var h = hsl[0], s = hsl[1], l = hsl[2];

        // 判断是否为"车身红色区域"：色相在红色范围(0-30 或 330-360)且饱和度>0.2
        var isRed = (h < 30 || h > 330) && s > 0.2 && l > 0.08 && l < 0.92;

        if (isRed) {
            // 替换为目标颜色，保留亮度关系
            var newH = target.h;
            var newS = target.s;
            var newL = Math.min(0.97, Math.max(0.02, l * target.lMul));

            var rgb = hslToRgb(newH, newS, newL);
            d[i] = rgb[0];
            d[i+1] = rgb[1];
            d[i+2] = rgb[2];
        }
    }

    colorCtx.putImageData(imgData, 0, 0);
    var dataUrl = colorCanvas.toDataURL('image/png');
    vImg.src = dataUrl;
    rImg.src = dataUrl;
    vImg.style.filter = 'drop-shadow(0 20px 60px rgba(37,99,235,0.15))';
    rImg.style.filter = 'blur(3px)';
}

// 读取当前选中的颜色 value（没选默认红）
function getCurrentColor() {
    var r = document.querySelector('input[name="color"]:checked');
    return r ? r.value : DEFAULT_COLOR;
}

// 绑定颜色事件
document.querySelectorAll('input[name="color"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
        recolorVehicle(radio.value);
        var vImg = document.getElementById('vehicleImg');
        if (vImg) {
            vImg.style.transform = 'scale(1.02)';
            setTimeout(function() { vImg.style.transform = 'scale(1)'; }, 300);
        }
        updateTags();
    });
});

// ====== 顶层静态 radio 变化绑定（vehicleType / color / quantity） ======
document.querySelectorAll('input[name="vehicleType"], input[name="quantity"]').forEach(radio => {
    radio.addEventListener('change', updateTags);
});

// ====== 动态规格数据收集 ======
function collectSpecs() {
    const specs = {};
    document.querySelectorAll(
        '#specStep1 input[type="radio"]:checked, #specStep2 input[type="radio"]:checked'
    ).forEach(r => {
        let value = r.value;
        if (value === '其他') {
            const custom = document.querySelector(`input[data-custom-for="${r.name}"]`);
            if (custom && custom.value.trim()) value = custom.value.trim();
        }
        const group = r.closest('.config-group');
        const label = group?.querySelector('.group-label')?.textContent || r.name;
        specs[label] = value;
    });
    document.querySelectorAll('#specStep1 textarea, #specStep2 textarea').forEach(t => {
        if (t.value.trim()) {
            const label = t.closest('.config-group')?.querySelector('.group-label')?.textContent || t.name;
            specs[label] = t.value.trim();
        }
    });
    return specs;
}

function updateTags() {
    const s = getSelections();
    const tags = [];
    if (s.vehicleType) tags.push(typeLabels[s.vehicleType]?.zh || s.vehicleType);
    // 取前3个规格展示
    const specVals = Object.values(s.specs).filter(Boolean).slice(0, 3);
    specVals.forEach(v => tags.push(v));
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
    return {
        vehicleType: get('vehicleType'),
        specs: collectSpecs(),
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
    const rows = [['车型', label]];
    Object.entries(s.specs).forEach(([k, v]) => rows.push([k, v || '未选择']));
    rows.push(['车身颜色', s.color?.split(' ')[0] || '未选择']);
    if (s.quantity) rows.push(['需求台数', s.quantity]);
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

// ====== 初始化 ======
// 默认渲染"直梁平板"的规格 + 预加载像素缓存
renderSpecsForType('直梁平板');
loadPixelsForType('直梁平板');
updateTags();
