// Public-facing, simplified exterior only. This is not an engineering or CAD model.
const $ = (id) => document.getElementById(id);
const text = {
  zh: {
    pageTitle: '栏板半挂车 · 360° 互动看车 | 湖北欧阳聚德汽车', skip: '跳到互动展示', back: '返回车型详情', title: '栏板半挂车', subtitle: '换个角度，看见整车。', modelLabel: '楚源牌 · 栏板系列', badge3d: '360° 外观示意', badgePhoto: '同系列实车参考', viewMode: '展示方式', mode3d: '3D 看车', modePhoto: '实车参考', hotspots: '点击查看整车部位', focusSide: '放大查看栏板', focusDeck: '放大查看货台', focusAxles: '放大查看车桥', focusLegs: '放大查看支腿', photoAlt: '同系列栏板半挂车实车参考，具体外形以所选型号实车为准', launchAlt: '同系列栏板半挂车实车参考', photoCaption: '同系列实车参考 · 具体外形与配置以所选型号实车为准', launchTitle: '整车外观，一手掌握', launchButton: '开启 3D 看车', launchHint: '自由旋转 · 点击放大 · 车身换色', viewControls: '视角控制', zoomOut: '缩小', zoomIn: '放大', reset: '全车视角', instructions: '拖动旋转 · 双指或滚轮缩放 · 点击圆点看局部', options: '外观与部位选择', explore: 'EXPLORE THE DETAILS', chooseDetail: '从整车，到每一处。', choosePart: '查看部位', overview: '整车外观', side: '分段栏板', deck: '开放式货台', axles: '三轴行走部分', legs: '前部支腿', bodyColor: '车身配色', blue: '海湾蓝', red: '朱砂红', white: '珍珠白', gray: '石墨灰', colorNote: '屏幕颜色仅作搭配参考，实车色以色卡为准。', specLink: '查看完整车型参数 ↗', disclaimer: '3D 为简化外观示意，非该型号精确模型；不表示具体选装或交付配置，以实车及订单为准。', specSummary: '型号参数摘要', specModel: '参考型号', specGross: '公告总质量', specAxles: '轴数', specBatch: '工信部公告', axleUnit: '轴', batchUnit: '批', nextStep: 'NEXT STEP', ctaTitle: '让这台车，适合你的运输。', ctaText: '把车型与需求告诉我们，一起确认适合的配置。', quote: '配置与询价', company: '湖北欧阳聚德汽车有限公司', loading: '正在准备互动展示…', failed: '暂时无法载入 3D，已为你显示同系列实车参考。', ready: '3D 已就绪，可拖动旋转或选择部位。', canvasLabel: '栏板半挂车 3D 外观示意。方向键旋转，加减键缩放，Home 键恢复全车视角。', homeLabel: '湖北欧阳聚德汽车首页', photoColor: '实车参考保留原始颜色；选择配色将回到 3D 看车。',
    detail: {
      overview: ['把整车看清楚', '转动查看栏板、货台和三轴布局。点击数字圆点，或选择上方部位，镜头会带你靠近。'],
      side: ['分段栏板，整齐勾勒车身', '从侧面观察分段栏板与货台的外形关系。本型号公告栏板高度含 500、550、600 mm，具体配置按订单确认。'],
      deck: ['从上方，看见货台空间', '俯视开放式货台，了解整体装载空间。公告车长含 12、12.5、13 m；示意中的尺寸比例不用于测量。'],
      axles: ['三轴布局，一目了然', '靠近查看三轴与轮胎的整体位置。本型号公告为 3 轴、12 条轮胎；品牌和具体选装以订单约定为准。'],
      legs: ['前部支腿，位置看得见', '镜头靠近前部支腿，了解整车外观与支撑位置。这里只呈现简化外形，具体配件型号按实际配置确认。']
    }
  },
  en: {
    pageTitle: 'Drop-Side Semi-Trailer · 360° Interactive View | Hubei Ouyang Jude', skip: 'Skip to interactive view', back: 'Vehicle details', title: 'Drop-Side Semi-Trailer', subtitle: 'A new angle on the whole vehicle.', modelLabel: 'Chuyuan · Drop-Side Series', badge3d: '360° Exterior Illustration', badgePhoto: 'Series Photo Reference', viewMode: 'View mode', mode3d: '3D View', modePhoto: 'Real Photo', hotspots: 'Select a vehicle area', focusSide: 'Look closer at the sideboards', focusDeck: 'Look closer at the cargo deck', focusAxles: 'Look closer at the axle group', focusLegs: 'Look closer at the landing legs', photoAlt: 'A real drop-side semi-trailer from the same series; the selected vehicle may differ', launchAlt: 'A real drop-side semi-trailer from the same series', photoCaption: 'Same-series photo reference · Exterior and equipment vary by vehicle', launchTitle: 'Explore from every angle', launchButton: 'Start 3D View', launchHint: 'Rotate freely · Look closer · Try body colors', viewControls: 'Camera controls', zoomOut: 'Zoom out', zoomIn: 'Zoom in', reset: 'Whole vehicle', instructions: 'Drag to rotate · Pinch or scroll to zoom · Select a point to explore', options: 'Exterior and area selection', explore: 'EXPLORE THE DETAILS', chooseDetail: 'The whole. And the details.', choosePart: 'Choose an area', overview: 'Whole vehicle', side: 'Sideboards', deck: 'Open cargo deck', axles: 'Three-axle group', legs: 'Landing legs', bodyColor: 'Body color', blue: 'Bay Blue', red: 'Vermilion Red', white: 'Pearl White', gray: 'Graphite Gray', colorNote: 'Screen colors are illustrative. Confirm the finish with a physical color sample.', specLink: 'Full vehicle specifications ↗', disclaimer: 'Simplified 3D exterior illustration, not a precise model of this vehicle. Options and delivered equipment are subject to the actual vehicle and order.', specSummary: 'Vehicle specification highlights', specModel: 'Reference model', specGross: 'Approved gross mass', specAxles: 'Axles', specBatch: 'MIIT approval', axleUnit: 'axles', batchUnit: 'batch', nextStep: 'NEXT STEP', ctaTitle: 'Make it fit your transport.', ctaText: 'Tell us your model and requirements. We will help confirm the configuration.', quote: 'Configure & Enquire', company: 'Hubei Ouyang Jude Automobile Co., Ltd.', loading: 'Preparing the interactive view…', failed: '3D is unavailable. A same-series vehicle photo is shown instead.', ready: '3D is ready. Drag to rotate or select an area.', canvasLabel: 'Drop-side semi-trailer 3D exterior illustration. Arrow keys rotate, plus and minus zoom, Home restores the whole vehicle.', homeLabel: 'Hubei Ouyang Jude home', photoColor: 'Reference photos keep their original color. Choosing a color returns to 3D.',
    detail: {
      overview: ['See the whole vehicle', 'Rotate to explore the sideboards, cargo deck and three-axle layout. Select a numbered point or an area above for a closer look.'],
      side: ['A defined, segmented profile', 'Explore the sideboard and deck arrangement from the side. Approved sideboard heights include 500, 550 and 600 mm. Confirm the configuration with your order.'],
      deck: ['An open view of the cargo deck', 'Look from above to understand the loading area. Approved vehicle lengths include 12, 12.5 and 13 m. This illustration is not for measurement.'],
      axles: ['A clear three-axle layout', 'Explore the general position of the axles and tires. This model is approved with 3 axles and 12 tires. Brands and optional equipment are subject to the order.'],
      legs: ['Locate the landing legs', 'Move closer to see the front supports in context. Only simplified exterior shapes are shown. Specific components depend on the confirmed configuration.']
    }
  }
};
const parameters = new URLSearchParams(location.search);
const isLowbed = parameters.get('model') === 'JDV9382TDP';
const modelId = isLowbed ? 'JDV9382TDP' : 'EHJ9400LB';
const palette = window.OYJD_3D.paints;
const lowbedAsset = window.OYJD_3D.models.JDV9382TDP;
if (isLowbed) {
  Object.assign(text.zh, {
    pageTitle:'挖机板 · 360° 互动看车 | 湖北欧阳聚德汽车',title:'挖机板 · 低平板半挂车',
    modelLabel:'襄汽牌 · JDV9382TDP', badgePhoto:'车型实拍参考',
    focusSide:'放大查看鹅颈',focusLegs:'放大查看双爬梯',side:'鹅颈外观',legs:'双列爬梯',
    photoAlt:'JDV9382TDP低平板半挂车实拍参考',launchAlt:'聚德大红挖机板3D外观展示',
    photoCaption:'车型实拍参考 · 具体配置以实车及订单为准',
    failed:'暂时无法载入3D，已显示车型实拍。你仍可查看参数和配置询价。',
    disclaimer:'3D 为车型外观展示，配色仅作参考；选装、尺寸及交付配置以实车、色卡和订单为准。',
    canvasLabel:'挖机板3D外观展示。方向键旋转，加减键缩放，Home恢复全车视角。',
    detail:{
      overview:['从鹅颈，到双列爬梯','拖动查看整车外观，点击圆点或部位名称放大查看。选择经典配色，感受不同的车身效果。'],
      side:['渐深鹅颈，连贯的车身轮廓','靠近观察前台、弧形下沿和根部外观，也可切换底面视角。'],
      deck:['开放货台，看清装载空间','俯视货台与花纹板表面，了解整车布局。具体尺寸及选装按实际运输需求确认。'],
      axles:['三轴布局，完整呈现','查看三轴轮组与侧边轮口。轮胎、轮毂及灯具保持各自材质，车身换色更直观。'],
      legs:['双列爬梯，近距离查看','转到车尾观察双列爬梯、尾灯和品牌挡泥皮。展示外观不代表所有选装配置。'],
      underside:['从下方，查看鹅颈外观','低视角查看鹅颈底面与根部凹口，拖动可继续调整观察角度。']
    }
  });
  Object.assign(text.en, {
    pageTitle:'Excavator Lowbed · 360° Interactive View | Hubei Ouyang Jude',title:'Excavator Lowbed',
    modelLabel:'Xiangqi · JDV9382TDP',badgePhoto:'Vehicle Photo Reference',
    focusSide:'Look closer at the gooseneck',focusLegs:'Look closer at the loading ramps',side:'Gooseneck',legs:'Twin loading ramps',
    photoAlt:'JDV9382TDP lowbed semi-trailer photo reference',launchAlt:'Jude Red excavator lowbed 3D exterior',
    photoCaption:'Vehicle photo reference · Equipment is subject to the actual vehicle and order',
    failed:'3D is unavailable. A vehicle photo is shown; specifications and enquiries remain available.',
    disclaimer:'3D exterior display. Colors are illustrative. Options, dimensions and delivered equipment are subject to the actual vehicle, color sample and order.',
    canvasLabel:'Excavator lowbed 3D exterior. Arrow keys rotate, plus and minus zoom, Home restores the whole vehicle.',
    detail:{
      overview:['From gooseneck to twin ramps','Drag to explore the exterior. Select a point or an area for a closer view, and try our classic body colors.'],
      side:['A continuous gooseneck profile','Explore the upper platform, curved lower edge and root. An underside view is also available.'],
      deck:['An open view of the loading deck','Look over the platform and tread plate. Confirm dimensions and equipment for your transport needs.'],
      axles:['See the three-axle layout','Explore the wheel groups and wheel openings. Tires, rims and lights keep their own finishes when body colors change.'],
      legs:['Explore the twin loading ramps','Move around the rear to view the ramps, tail lights and branded mudflaps. The display does not represent every equipment option.'],
      underside:['See the gooseneck underside','Use this lower viewpoint to inspect the exterior skin and recessed root. Drag to change the angle.']
    }
  });
}
const initialPaint = palette.find(paint => paint.id === parameters.get('paint')) || palette[0];
const state = { lang: parameters.get('lang') === 'en' ? 'en' : 'zh', part: 'overview', color: initialPaint.id, mode: '3d', loading: false, error: false };
const colors = Object.fromEntries(palette.map(paint => [paint.id, paint.hex]));
const colorRow = document.querySelector('.color-row');
colorRow.replaceChildren(...palette.map(paint => {
  const button = document.createElement('button');
  button.type = 'button';button.className = 'color-swatch';button.dataset.color = paint.id;
  button.style.setProperty('--swatch',paint.hex);
  const chip = document.createElement('span');chip.className='paint-chip';chip.setAttribute('aria-hidden','true');
  const label = document.createElement('span');label.className='paint-label';button.append(chip,label);return button;
}));
const colorName = document.createElement('span');colorName.id='colorName';colorRow.append(colorName);
document.querySelector('.experience-layout').insertAdjacentElement('afterend', document.querySelector('.color-options'));
if (isLowbed) {
  $('modelId').textContent=modelId;
  document.querySelector('#photoReference img').src=lowbedAsset.photoUrl;
  document.querySelector('.launch-photo').src=lowbedAsset.posterUrl;
  document.querySelectorAll('.spec-strip strong')[0].textContent=modelId;
  document.querySelectorAll('.spec-strip strong')[1].innerHTML='38,000 <small>kg</small>';
  document.querySelectorAll('.spec-strip strong')[3].innerHTML='387 <small data-i18n="batchUnit">批</small>';
  const button=document.createElement('button');button.type='button';button.className='focus-option';button.dataset.focus='underside';button.setAttribute('aria-pressed','false');button.id='undersideButton';
  document.querySelector('.focus-options').append(button);
}
let engine = null;
let pendingLoad = null;
let statusKey = '';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function setStatus(key) { statusKey = key; $('viewerStatus').textContent = key ? text[state.lang][key] : ''; }
function updateDetail() {
  const [title, description] = text[state.lang].detail[state.part];
  $('detailTitle').textContent = title;
  $('detailDescription').textContent = description;
  document.querySelectorAll('[data-focus]').forEach((button) => {
    const active = button.dataset.focus === state.part;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
function updateColor() {
  const selected = palette.find(paint => paint.id === state.color);
  $('colorName').textContent = state.lang === 'en' ? selected.labelEn : selected.label;
  document.querySelectorAll('[data-color]').forEach((button) => {
    const active = button.dataset.color === state.color;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
    const paint=palette.find(paint=>paint.id===button.dataset.color);
    const label=state.lang==='en'?paint.labelEn:paint.label;
    button.setAttribute('aria-label',label);button.title=paint.name;
    button.querySelector('.paint-label').textContent=label;
  });
  const quote=new URL('/configurator.html',location.origin);
  quote.searchParams.set('model',modelId);quote.searchParams.set('paint',state.color);
  $('quoteLink').href=quote.pathname+quote.search;
}
function applyLanguage() {
  const strings = text[state.lang];
  document.documentElement.lang = state.lang === 'en' ? 'en' : 'zh-CN';
  document.title = strings.pageTitle;
  document.querySelectorAll('[data-i18n]').forEach((element) => { if (strings[element.dataset.i18n]) element.textContent = strings[element.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-aria]').forEach((element) => element.setAttribute('aria-label', strings[element.dataset.i18nAria]));
  document.querySelectorAll('[data-i18n-alt]').forEach((element) => element.alt = strings[element.dataset.i18nAlt]);
  $('languageSwitch').setAttribute('aria-label', state.lang === 'en' ? '切换为中文' : 'Switch to English');
  $('languageSwitch').querySelectorAll('span').forEach((span) => span.classList.toggle('active', span.lang === (state.lang === 'en' ? 'en' : 'zh-CN')));
  const prefix = state.lang === 'en' ? '/en' : '';
  $('homeLink').href = `${prefix}/`;
  $('homeLink').setAttribute('aria-label', strings.homeLabel);
  $('backLink').href = `${prefix}/vehicles/${modelId}.html`;
  $('specLink').href = `${prefix}/vehicles/${modelId}.html`;
  if ($('undersideButton')) $('undersideButton').textContent = state.lang === 'en' ? '05   Gooseneck underside ↗' : '05   鹅颈底面 ↗';
  $('viewBadge').textContent = state.mode === 'photo' ? strings.badgePhoto : strings.badge3d;
  if (engine) engine.canvas.setAttribute('aria-label', strings.canvasLabel);
  updateColor(); updateDetail(); setStatus(statusKey);
}

function showMode(mode) {
  state.mode = mode;
  const isPhoto = mode === 'photo';
  $('viewer').classList.toggle('photo-mode', isPhoto);
  $('modePhoto').setAttribute('aria-pressed', String(isPhoto));
  $('mode3d').setAttribute('aria-pressed', String(!isPhoto));
  $('photoReference').hidden = !isPhoto;
  $('viewerLaunch').hidden = isPhoto || Boolean(engine);
  $('renderSurface').hidden = isPhoto || !engine;
  $('hotspots').hidden = isPhoto || !engine;
  $('viewerTools').hidden = isPhoto || !engine;
  $('viewerInstructions').hidden = isPhoto || !engine;
  $('viewBadge').textContent = text[state.lang][isPhoto ? 'badgePhoto' : 'badge3d'];
  if (engine) engine.setVisible(!isPhoto);
  if (!state.error) setStatus('');
}

async function activatePart(part) {
  state.part = part; updateDetail();
  showMode('3d');
  if (await loadViewer()) engine.focus(state.part);
}

async function loadViewer() {
  if (engine) return true;
  if (pendingLoad) return pendingLoad;
  state.loading = true; state.error = false;
  $('startViewer').disabled = true;
  $('viewer').setAttribute('aria-busy', 'true');
  setStatus('loading');
  pendingLoad = (async () => {
    try {
      if (isLowbed) {
        const {createLowbedViewer}=await import('/lowbed-viewer.js?v=20260929a');
        engine=await createLowbedViewer({surface:$('renderSurface'),color:colors[state.color],modelUrl:lowbedAsset.modelUrl,label:text[state.lang].canvasLabel,
          onError:()=>{state.error=true;engine?.dispose();engine=null;showMode('photo');setStatus('failed');},
          onHotspots:points=>document.querySelectorAll('.hotspot').forEach(button=>{
            const point=points[button.dataset.focus];
            button.hidden=!point?.visible;
            if(point) button.style.transform=`translate(${point.x}px,${point.y}px) translate(-50%,-50%)`;
          })
        });
      } else {
      const [THREE, controlsModule] = await Promise.all([
        import('/assets/vendor/three-r182/three.module.min.js'),
        import('/assets/vendor/three-r182/OrbitControls.js')
      ]);
      engine = createViewer(THREE, controlsModule.OrbitControls);
      }
      engine.setColor(colors[state.color]);
      engine.canvas.setAttribute('aria-label',text[state.lang].canvasLabel);
      if(isLowbed) engine.canvas.addEventListener('keydown',event=>{if(event.key==='Home'){state.part='overview';updateDetail();}});
      showMode(state.mode);
      if (state.mode === '3d') setStatus('ready');
      window.setTimeout(() => { if (statusKey === 'ready') setStatus(''); }, 2800);
      return true;
    } catch (error) {
      console.warn('Interactive vehicle view is unavailable.', error);
      state.error = true; showMode('photo'); setStatus('failed');
      return false;
    } finally {
      state.loading = false; pendingLoad = null;
      $('startViewer').disabled = false;
      $('viewer').removeAttribute('aria-busy');
    }
  })();
  return pendingLoad;
}

$('languageSwitch').addEventListener('click', () => {
  state.lang = state.lang === 'zh' ? 'en' : 'zh';
  const url = new URL(location.href);
  if (state.lang === 'en') url.searchParams.set('lang', 'en'); else url.searchParams.delete('lang');
  history.replaceState(null, '', url); applyLanguage();
});
$('startViewer').addEventListener('click', () => activatePart(state.part));
$('mode3d').addEventListener('click', async () => { showMode('3d'); await loadViewer(); });
$('modePhoto').addEventListener('click', () => showMode('photo'));
document.querySelectorAll('[data-focus]').forEach((button) => button.addEventListener('click', () => activatePart(button.dataset.focus)));
document.querySelectorAll('[data-color]').forEach((button) => button.addEventListener('click', async () => {
  state.color = button.dataset.color; updateColor(); showMode('3d');
  if (await loadViewer()) engine.setColor(colors[state.color]);
}));
$('resetView').addEventListener('click', () => activatePart('overview'));
$('zoomIn').addEventListener('click', () => engine?.zoom(0.8));
$('zoomOut').addEventListener('click', () => engine?.zoom(1.25));
applyLanguage();

function createViewer(T, OrbitControls) {
  const surface = $('renderSurface');
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(max-width: 820px)').matches ? 1.5 : 2));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', text[state.lang].canvasLabel);
  surface.replaceChildren(canvas);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.autoRotate = false;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.75;
  controls.minDistance = 3.8; controls.maxDistance = 36;
  controls.minPolarAngle = 0.18; controls.maxPolarAngle = Math.PI / 2 - 0.04;

  scene.add(new T.HemisphereLight(0xf3f8ff, 0x68768b, 2.5));
  const key = new T.DirectionalLight(0xfff8ed, 3.8);
  key.position.set(-4, 12, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 8, bottom: -8, near: 1, far: 30 });
  key.shadow.bias = -0.0005; key.shadow.normalBias = 0.035; key.shadow.radius = 3;
  scene.add(key);
  const fill = new T.DirectionalLight(0xc5ddff, 2.2); fill.position.set(4, 5, -8); scene.add(fill);
  const rim = new T.DirectionalLight(0xffffff, 1.5); rim.position.set(8, 6, 4); scene.add(rim);
  const floor = new T.Mesh(new T.PlaneGeometry(200, 200), new T.ShadowMaterial({ color: 0x293a53, opacity: 0.24 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.01; floor.receiveShadow = true; scene.add(floor);
  const groundRing = new T.Mesh(new T.RingGeometry(7.6, 7.615, 128), new T.MeshBasicMaterial({ color: 0x8ca2b9, transparent: true, opacity: 0.22, side: T.DoubleSide }));
  groundRing.rotation.x = -Math.PI / 2; groundRing.position.y = 0.015; groundRing.scale.y = 0.5; scene.add(groundRing);

  const bodyMaterial = new T.MeshStandardMaterial({ color: colors['jude-red'], metalness: 0.34, roughness: 0.33 });
  const edgeMaterial = new T.MeshStandardMaterial({ color: colors['jude-red'], metalness: 0.36, roughness: 0.3 });
  const chassisMaterial = new T.MeshStandardMaterial({ color: 0x293546, metalness: 0.4, roughness: 0.5 });
  const deckMaterial = new T.MeshStandardMaterial({ color: 0x738294, metalness: 0.4, roughness: 0.72 });
  const tireMaterial = new T.MeshStandardMaterial({ color: 0x192028, metalness: 0.03, roughness: 0.82 });
  const rubberEdgeMaterial = new T.MeshStandardMaterial({ color: 0x252d37, metalness: 0.02, roughness: 0.74 });
  const rimMaterial = new T.MeshStandardMaterial({ color: 0xabb8c4, metalness: 0.68, roughness: 0.3 });
  const hubMaterial = new T.MeshStandardMaterial({ color: 0x626f7c, metalness: 0.6, roughness: 0.4 });
  const markerMaterial = new T.MeshStandardMaterial({ color: 0xf2ece5, metalness: 0.1, roughness: 0.36 });
  const redMarkerMaterial = new T.MeshStandardMaterial({ color: 0xf5605b, emissive: 0x601211, emissiveIntensity: 0.2, roughness: 0.4 });
  const amberMaterial = new T.MeshStandardMaterial({ color: 0xffba52, emissive: 0x7b3104, emissiveIntensity: 0.25, roughness: 0.4 });
  const trailer = new T.Group(); scene.add(trailer);
  const unitBox = new T.BoxGeometry(1, 1, 1);
  const isPaint = material => material === bodyMaterial || material === edgeMaterial;
  function box(width, height, depth, x, y, z, material = bodyMaterial) {
    const mesh = new T.Mesh(unitBox, material); mesh.scale.set(width, height, depth); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = !isPaint(material); trailer.add(mesh); return mesh;
  }
  function repeatedBoxes(transforms, material) {
    const mesh = new T.InstancedMesh(unitBox, material, transforms.length);
    const dummy = new T.Object3D();
    transforms.forEach(([w,h,d,x,y,z], i) => { dummy.position.set(x,y,z); dummy.scale.set(w,h,d); dummy.updateMatrix(); mesh.setMatrixAt(i,dummy.matrix); });
    // Keep clean paint shading at close range. Thin exterior ribs otherwise
    // self-shadow into dark bands at the deliberately small mobile shadow map.
    mesh.castShadow = true; mesh.receiveShadow = !isPaint(material); trailer.add(mesh); return mesh;
  }
  // Exterior silhouette: straight cargo deck, segmented sides and a tall front board.
  box(13, 0.17, 2.55, 0, 1.39, 0);
  box(12.7, 0.05, 2.33, 0, 1.505, 0, deckMaterial);
  box(12.85, 0.24, 0.1, 0, 1.235, 1.18, edgeMaterial);
  box(12.85, 0.24, 0.1, 0, 1.235, -1.18, edgeMaterial);
  // A simple closed chassis silhouette avoids exposing internal production details.
  box(12.4, 0.24, 1.68, 0, 1.12, 0, chassisMaterial);
  const ribs = [], topRails = [], panels = [], reflectors = [], reflectorReds = [];
  for (const side of [-1, 1]) {
    for (let panel = 0; panel < 6; panel++) {
      const x = -5.35 + panel * 2.14;
      panels.push([2.04, 0.56, 0.065, x, 1.81, side * 1.242]);
      for (let rib = 0; rib < 8; rib++) ribs.push([0.038, 0.5, 0.055, x - 0.86 + rib * 0.245, 1.81, side * 1.293]);
    }
    for (let i = 0; i < 7; i++) ribs.push([0.085, 0.66, 0.105, -6.42 + i * 2.14, 1.825, side * 1.235]);
    topRails.push([12.93, 0.065, 0.09, 0, 2.12, side * 1.25], [12.93, 0.085, 0.09, 0, 1.53, side * 1.25]);
    for (let i = 0; i < 12; i++) (i % 2 ? reflectors : reflectorReds).push([0.38, 0.05, 0.015, -5.9 + i * 1.04, 1.4, side * 1.288]);
    // A simplified side guard, without fittings or manufacturing detail.
    box(3.9, 0.095, 0.065, -1.75, 0.66, side * 1.06, rimMaterial);
    box(3.9, 0.095, 0.065, -1.75, 0.9, side * 1.06, rimMaterial);
    box(0.055, 0.46, 0.065, -3.55, 0.85, side * 1.06, rimMaterial);
    box(0.055, 0.46, 0.065, 0.05, 0.85, side * 1.06, rimMaterial);
    for (const x of [-5.8, -2.8, 0.5, 5.9]) box(0.11, 0.045, 0.025, x, 1.27, side * 1.29, amberMaterial);
  }
  repeatedBoxes(panels, bodyMaterial); repeatedBoxes(ribs, edgeMaterial); repeatedBoxes(topRails, edgeMaterial);
  repeatedBoxes(reflectors, markerMaterial); repeatedBoxes(reflectorReds, redMarkerMaterial);
  box(0.12, 1.72, 2.54, -6.43, 2.29, 0);
  box(0.13, 0.075, 2.61, -6.43, 3.17, 0, edgeMaterial);
  for (let z = -0.96; z < 1.1; z += 0.48) box(0.07, 1.66, 0.05, -6.35, 2.29, z, edgeMaterial);
  box(0.09, 0.63, 2.52, 6.45, 1.82, 0);
  for (let z = -1.08; z < 1.15; z += 0.24) box(0.05, 0.5, 0.04, 6.51, 1.82, z, edgeMaterial);
  box(0.1, 0.08, 2.59, 6.45, 2.13, 0, edgeMaterial);
  box(0.15, 0.15, 2.35, 6.32, 0.62, 0, chassisMaterial);
  for (const z of [-0.92, 0.92]) {
    box(0.19, 0.4, 0.11, 6.15, 0.89, z, chassisMaterial);
    box(0.06, 0.13, 0.38, 6.5, 1.13, z, redMarkerMaterial);
  }
  const tireGeometry = new T.CylinderGeometry(0.535, 0.535, 0.22, 32, 1);
  const wheelRimGeometry = new T.CylinderGeometry(0.313, 0.313, 0.238, 32, 1);
  const hubGeometry = new T.CylinderGeometry(0.12, 0.12, 0.27, 24, 1);
  const sidewallGeometry = new T.TorusGeometry(0.417, 0.048, 8, 32);
  const axleGeometry = new T.CylinderGeometry(0.08, 0.08, 2.0, 12);
  for (const x of [2.18, 3.49, 4.80]) {
    const axle = new T.Mesh(axleGeometry, chassisMaterial); axle.rotation.x = Math.PI / 2; axle.position.set(x,0.55,0); trailer.add(axle);
    for (const side of [-1, 1]) {
      for (const widthPos of [0.815, 1.065]) {
        const tire = new T.Mesh(tireGeometry, tireMaterial); tire.rotation.x = Math.PI / 2; tire.position.set(x,0.55,side * widthPos); tire.castShadow = true; trailer.add(tire);
        const wheel = new T.Mesh(wheelRimGeometry, rimMaterial); wheel.rotation.x = Math.PI / 2; wheel.position.copy(tire.position); trailer.add(wheel);
      }
      const ring = new T.Mesh(sidewallGeometry, rubberEdgeMaterial); ring.position.set(x,0.55,side * 1.186); trailer.add(ring);
      const hub = new T.Mesh(hubGeometry, hubMaterial); hub.rotation.x = Math.PI / 2; hub.position.set(x,0.55,side * 1.065); trailer.add(hub);
    }
  }
  for (const side of [-1,1]) {
    box(4.0, 0.04, 0.52, 3.49, 1.135, side * 0.965, chassisMaterial);
    box(0.045, 0.54, 0.52, 5.4, 0.69, side * 0.965, tireMaterial);
    box(0.19, 0.7, 0.18, -3.72, 0.78, side * 0.87, chassisMaterial);
    box(0.13, 0.38, 0.13, -3.72, 0.25, side * 0.87, rimMaterial);
    box(0.4, 0.07, 0.34, -3.72, 0.065, side * 0.87, chassisMaterial);
  }

  const points = {
    side: new T.Vector3(-0.8, 1.91, 1.31),
    deck: new T.Vector3(-2.1, 1.61, -0.15),
    axles: new T.Vector3(3.48, 0.68, 1.24),
    legs: new T.Vector3(-3.72, 0.66, 0.99)
  };
  const allHotspots = [...document.querySelectorAll('.hotspot')];
  const projected = new T.Vector3();
  const raycaster = new T.Raycaster();
  const rayDirection = new T.Vector3();
  const modelMeshes = [];
  trailer.traverse((obj) => { if (obj.isMesh) modelMeshes.push(obj); });
  let width = 1, height = 1, visible = true, frame = 0, tween = null, destroyed = false;
  function overview() {
    const target = new T.Vector3(0, 1.05, 0);
    const distance = Math.max(20.5, 20 / Math.max(width / height, 0.6) + 5);
    const direction = new T.Vector3(-11.5, 7.65, 17).normalize();
    return { target, position: target.clone().add(direction.multiplyScalar(distance)) };
  }
  function viewFor(part) {
    const closerScale = width < 520 ? 1.3 : 1;
    const views = {
      side: { target: [-0.8,1.77,0], offset: [-2.7,2.1,7.7] },
      deck: { target: [-0.7,1.4,0], offset: [-5.7,10.5,7] },
      axles: { target: [3.45,0.72,0], offset: [3.5,2.2,5.5] },
      legs: { target: [-3.72,0.76,0], offset: [-3.8,2.15,5.5] }
    };
    if (!views[part]) return overview();
    const target = new T.Vector3(...views[part].target);
    return { target, position: target.clone().add(new T.Vector3(...views[part].offset).multiplyScalar(closerScale)) };
  }
  function placeHotspots() {
    const occupied = [];
    allHotspots.forEach((button) => {
      const point = points[button.dataset.focus];
      projected.copy(point).project(camera);
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      let show = projected.z > -1 && projected.z < 1 && x > 28 && x < width - 28 && y > 88 && y < height - 115;
      if (show) {
        rayDirection.subVectors(point,camera.position).normalize(); raycaster.set(camera.position,rayDirection);
        const hits = raycaster.intersectObjects(modelMeshes,false);
        if (hits.length && hits[0].distance < camera.position.distanceTo(point) - 0.24) show = false;
      }
      if (show && occupied.some(([ox,oy]) => Math.hypot(ox - x,oy - y) < 43)) show = false;
      if (show) occupied.push([x,y]);
      button.hidden = !show;
      button.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -50%)`;
    });
  }
  function render(now) {
    frame = 0;
    if (destroyed || !visible || document.hidden) return;
    if (tween) {
      const t = Math.min(1,(now - tween.start) / 700);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2,3) / 2;
      camera.position.lerpVectors(tween.from,tween.to,ease);
      controls.target.lerpVectors(tween.fromTarget,tween.toTarget,ease);
      if (t === 1) tween = null;
    }
    controls.update(); renderer.render(scene,camera); placeHotspots();
    if (tween) requestRender();
  }
  function requestRender() { if (!frame && !destroyed && visible && !document.hidden) frame = requestAnimationFrame(render); }
  function moveTo(position,target,animate = true) {
    if (reducedMotion.matches || !animate) { tween = null; camera.position.copy(position); controls.target.copy(target); }
    else tween = { start: performance.now(), from: camera.position.clone(), to: position.clone(), fromTarget: controls.target.clone(), toTarget: target.clone() };
    requestRender();
  }
  function focus(part) { const view = viewFor(part); moveTo(view.position,view.target); }
  function zoom(multiplier) {
    tween = null;
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(T.MathUtils.clamp(offset.length() * multiplier,controls.minDistance,controls.maxDistance));
    moveTo(controls.target.clone().add(offset),controls.target);
  }
  const resizeObserver = new ResizeObserver(() => {
    const rect = $('viewer').getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const first = width === 1;
    const aspectWas = width / height;
    width = rect.width; height = rect.height;
    renderer.setSize(width,height,false); camera.aspect = width / height; camera.updateProjectionMatrix();
    if (first || (state.part === 'overview' && Math.abs(aspectWas - camera.aspect) > 0.2)) { const view = viewFor(state.part); moveTo(view.position,view.target,false); }
    requestRender();
  });
  resizeObserver.observe($('viewer'));
  controls.addEventListener('change',requestRender);
  controls.addEventListener('start',() => { tween = null; });
  canvas.addEventListener('keydown',(event) => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_','Home'].includes(event.key)) return;
    event.preventDefault(); tween = null;
    if (event.key === 'Home') { state.part = 'overview'; updateDetail(); focus('overview'); return; }
    if ('+=-_'.includes(event.key)) { zoom('+-'.includes(event.key) ? (event.key === '+' ? 0.85 : 1.18) : (event.key === '=' ? 0.85 : 1.18)); return; }
    const spherical = new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if (event.key === 'ArrowLeft') spherical.theta -= 0.12;
    if (event.key === 'ArrowRight') spherical.theta += 0.12;
    if (event.key === 'ArrowUp') spherical.phi -= 0.1;
    if (event.key === 'ArrowDown') spherical.phi += 0.1;
    spherical.phi = T.MathUtils.clamp(spherical.phi,controls.minPolarAngle,controls.maxPolarAngle);
    moveTo(new T.Vector3().setFromSpherical(spherical).add(controls.target),controls.target);
  });
  canvas.addEventListener('webglcontextlost',(event) => {
    event.preventDefault(); state.error = true; showMode('photo'); setStatus('failed');
  });
  canvas.addEventListener('webglcontextrestored',() => { state.error = false; requestRender(); });
  document.addEventListener('visibilitychange',() => { if (!document.hidden) requestRender(); });
  window.addEventListener('pagehide',(event) => {
    if (event.persisted) return;
    destroyed = true; cancelAnimationFrame(frame); resizeObserver.disconnect(); controls.dispose();
    scene.traverse((obj) => { obj.geometry?.dispose(); if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((material) => material.dispose()); });
    renderer.dispose();
  },{ once: true });
  const start = overview(); camera.position.copy(start.position); controls.target.copy(start.target); controls.update();
  return { canvas, focus, zoom,
    setColor(color) { bodyMaterial.color.set(color); edgeMaterial.color.set(color); edgeMaterial.color.multiplyScalar(1.06); requestRender(); },
    setVisible(value) { visible = value; if (value) requestRender(); else { cancelAnimationFrame(frame); frame = 0; } }
  };
}
