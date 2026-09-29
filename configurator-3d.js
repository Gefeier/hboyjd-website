/* Optional exterior viewer. Enquiry data and submission stay in configurator.js. */
function initConfigurator3d() {
  const data = window.OYJD_3D;
  const definition = data?.models?.JDV9382TDP;
  const panel = document.getElementById('configurator3d');
  if (!definition || !panel || !data.paints?.length) return;
  const byId = id => document.getElementById(id);
  const stage = byId('vehicleStage');
  const host = byId('cfg3dSurfaceHost');
  const poster = byId('cfg3dPoster');
  const start = byId('cfg3dStart');
  const status = byId('cfg3dStatus');
  const photo = byId('cfg3dPhoto');
  const zoom = byId('cfg3dZoom');
  const palette = byId('cfg3dPaints');
  const customColor = byId('cfg3dCustomColor');
  const customHex = byId('cfg3dCustomHex');
  const screenColor = byId('customScreenColor');
  const environmentSelect = byId('cfg3dEnvironment');
  const checked = name => document.querySelector(`input[name="${name}"]:checked`)?.value || '';
  let engine = null;
  let pending = null;
  let loadController = null;
  let generation = 0;
  let eligible = false;
  let photoMode = false;
  let failed = false;
  let activePart = 'overview';
  let environment = 'studio';

  function currentPaint() {
    const hex = checked('color') === '其他' && data.normalizeColor(screenColor.value);
    if (hex) return {id: 'custom', name: '其他', label: '自由配色', hex};
    return data.paints.find(paint => paint.name === checked('color')) || null;
  }
  function colorError(invalid) {
    customHex.setAttribute('aria-invalid', String(invalid));
    byId('cfg3dColorError').hidden = !invalid;
  }
  function syncColorControls() {
    const paint = currentPaint();
    if (paint) {
      customColor.value = paint.hex;
      customHex.value = paint.hex.toUpperCase();
    }
    colorError(false);
  }
  function applyCustomColor(value) {
    const hex = data.normalizeColor(value);
    colorError(!hex);
    if (!hex) return false;
    const radio = Array.from(document.querySelectorAll('input[name="color"]')).find(input => input.value === '其他');
    if (!radio) return false;
    screenColor.value = hex;
    radio.checked = true;
    radio.dispatchEvent(new Event('change', {bubbles: true}));
    return true;
  }
  function matchesModel() {
    const axles = checked('axles');
    const ladder = checked('ladder');
    return byId('modelDirect')?.value === 'JDV9382TDP'
      && checked('vehicleType') === '高低平板'
      && checked('variant') === '三轴低平板'
      && (!axles || axles === '3轴')
      && (!ladder || ladder === '机械爬梯');
  }
  function paintLabel() {
    const paint = currentPaint();
    byId('cfg3dPaintName').textContent = paint?.id === 'custom' ? '自由配色 · ' + paint.hex : paint ? paint.label : '其他颜色 · 请确认色卡';
    palette.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.paint === paint?.id)));
    const params = new URLSearchParams({model: 'JDV9382TDP'});
    if (paint) params.set('paint', paint.id);
    if (paint?.id === 'custom') params.set('customColor', paint.hex.slice(1));
    byId('cfg3dFull').href = '/vehicle-experience.html?' + params;
  }
  function updateMode() {
    const rendered = Boolean(engine) && !photoMode;
    host.hidden = !(rendered || Boolean(pending));
    poster.hidden = rendered;
    zoom.hidden = !rendered;
    start.hidden = rendered;
    start.disabled = Boolean(pending);
    start.textContent = pending ? '正在准备 3D…' : failed ? '重新载入 3D' : photoMode ? '返回 3D 看车' : '开启 3D 看车';
    photo.setAttribute('aria-pressed', String(photoMode));
    photo.textContent = photoMode ? '静态预览' : '实车参考';
    poster.src = (photoMode ? definition.photoUrl : definition.posterUrl) || definition.posterUrl;
    poster.alt = photoMode ? 'JDV9382TDP 低平板半挂车实车参考，保留原始颜色' : 'JDV9382TDP 低平板半挂车 3D 外观示意，静态聚德红预览';
    engine?.setVisible(rendered && eligible && !document.hidden);
    paintLabel();
  }
  function selectPart(part) {
    activePart = part;
    panel.querySelectorAll('[data-cfg3d-focus]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.cfg3dFocus === part)));
  }
  function disposeViewer() {
    ++generation;
    loadController?.abort();
    loadController = null;
    pending = null;
    engine?.dispose();
    engine = null;
    host.replaceChildren();
    host.hidden = true;
    panel.removeAttribute('aria-busy');
    selectPart('overview');
  }
  function failViewer() {
    disposeViewer();
    failed = true;
    photoMode = true;
    status.textContent = '3D 暂时无法显示，已切换实车参考；可以重试或继续选配。';
    updateMode();
  }
  async function activate(part) {
    if (!matchesModel()) return;
    photoMode = false;
    const requestedFocus = typeof part === 'string';
    if (requestedFocus) selectPart(part);
    if (engine) {
      engine.setColor((currentPaint() || data.paints[0]).hex);
      if (requestedFocus) engine.focus(part);
      status.textContent = currentPaint() ? '拖动旋转 · 双指或滚轮缩放 · 点击部位放大' : '其他颜色需确认色卡，3D 暂以聚德大红示意。';
      updateMode();
      return;
    }
    if (pending) return pending;
    const token = ++generation;
    const controller = new AbortController();
    loadController = controller;
    const surface = document.createElement('div');
    surface.className = 'cfg3d-surface';
    host.replaceChildren(surface);
    failed = false;
    panel.setAttribute('aria-busy', 'true');
    status.textContent = '正在载入 3D 外观…';
    pending = (async () => {
      let viewer;
      try {
        const module = await import('/lowbed-viewer.js?v=20260929b');
        if (token !== generation || !matchesModel()) return;
        // Each load owns a separate surface. A late result cannot replace a new model.
        viewer = await module.createLowbedViewer({
          surface, modelUrl: definition.modelUrl,
          signal: controller.signal,
          environment,
          color: (currentPaint() || data.paints[0]).hex,
          label: 'JDV9382TDP 低平板 3D 外观示意，可拖动旋转及缩放',
          onError: () => { if (token === generation && eligible) failViewer(); }
        });
        if (token !== generation || !matchesModel()) { viewer?.dispose(); return; }
        engine = viewer;
        engine.canvas.addEventListener('keydown', event => {
          if (event.key === 'Home') selectPart('overview');
        }, {signal: controller.signal});
        engine.setColor((currentPaint() || data.paints[0]).hex);
        engine.setEnvironment(environment);
        engine.focus(activePart);
        status.textContent = currentPaint() ? '拖动旋转 · 双指或滚轮缩放 · 点击部位放大' : '其他颜色需确认色卡，3D 暂以聚德大红示意。';
      } catch (error) {
        viewer?.dispose();
        if (token === generation && !controller.signal.aborted) failViewer();
      } finally {
        if (token === generation) {
          pending = null;
          panel.removeAttribute('aria-busy');
          updateMode();
        }
      }
    })();
    updateMode();
    return pending;
  }

  function reconcile() {
    const next = matchesModel();
    if (!next && (eligible || pending || engine)) disposeViewer();
    const changed = next !== eligible;
    eligible = next;
    panel.hidden = !next;
    stage.classList.toggle('has-lowbed-preview', next);
    document.body.classList.toggle('has-configurator-3d', next);
    byId('cfg3dUnavailable').hidden = next || byId('modelDirect')?.value !== 'JDV9382TDP';
    if (!next) return;
    if (changed) {
      photoMode = false;
      failed = false;
      status.textContent = '静态预览 · 开启 3D 查看所选配色与部位';
    }
    if (engine) engine.setColor((currentPaint() || data.paints[0]).hex);
    updateMode();
  }

  data.paints.forEach(paint => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.paint = paint.id;
    button.style.setProperty('--paint', paint.hex);
    button.title = paint.name;
    button.setAttribute('aria-label', paint.name);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const radio = Array.from(document.querySelectorAll('input[name="color"]')).find(input => input.value === paint.name);
      if (!radio) return;
      radio.checked = true;
      radio.dispatchEvent(new Event('change', {bubbles: true}));
    });
    palette.append(button);
  });
  customColor.addEventListener('input', () => applyCustomColor(customColor.value));
  customHex.addEventListener('input', () => {
    // Keep incomplete typing in the text field; only a full, valid HEX changes paint.
    if (data.normalizeColor(customHex.value)) applyCustomColor(customHex.value);
    else colorError(true);
  });
  customHex.addEventListener('change', () => applyCustomColor(customHex.value));
  customHex.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); applyCustomColor(customHex.value); }
  });
  environmentSelect.addEventListener('change', () => {
    if (!['studio', 'graphite', 'daylight'].includes(environmentSelect.value)) return;
    environment = environmentSelect.value;
    engine?.setEnvironment(environment);
  });
  start.addEventListener('click', () => activate());
  photo.addEventListener('click', () => {
    photoMode = !photoMode;
    status.textContent = photoMode ? '实车参考保留原始颜色；选择配色可返回 3D。' : engine ? '拖动旋转 · 双指或滚轮缩放' : '静态预览 · 开启 3D 查看所选配色与部位';
    updateMode();
  });
  poster.addEventListener('error', () => {
    if (poster.dataset.fallback !== 'used' && definition.photoUrl && poster.src !== new URL(definition.photoUrl, location.href).href) {
      poster.dataset.fallback = 'used'; poster.src = definition.photoUrl;
    } else status.textContent = '预览图暂时无法显示，可以开启 3D 或继续选配。';
  });
  panel.querySelectorAll('[data-cfg3d-focus]').forEach(button => button.addEventListener('click', () => activate(button.dataset.cfg3dFocus)));
  panel.querySelectorAll('[data-cfg3d-zoom]').forEach(button => button.addEventListener('click', () => engine?.zoom(Number(button.dataset.cfg3dZoom))));
  document.addEventListener('change', event => {
    if (!event.target.matches('#modelDirect, input[name="vehicleType"], input[name="variant"], input[name="axles"], input[name="ladder"], input[name="color"]')) return;
    if (event.target.name === 'color') {
      if (checked('color') !== '其他') screenColor.value = '';
      syncColorControls();
    }
    // Base form handlers finish their synchronous model/variant changes first.
    reconcile();
    if (event.target.name === 'color' && eligible) void activate();
  });
  document.addEventListener('visibilitychange', () => engine?.setVisible(eligible && !photoMode && !document.hidden));
  window.addEventListener('pagehide', event => { if (!event.persisted) disposeViewer(); });
  syncColorControls();
  reconcile();
}

if (document.readyState === 'complete') initConfigurator3d();
else document.addEventListener('DOMContentLoaded', initConfigurator3d, {once: true});
