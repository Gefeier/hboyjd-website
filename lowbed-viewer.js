// Approved public exterior asset only. Geometry is illustrative, not production CAD.
// Three.js modules and the GLB are fetched only when this function is invoked.
export async function createLowbedViewer({ surface, color = '#247bc1', environment: initialEnvironment = 'studio', modelUrl, onError, onHotspots, label, signal } = {}) {
  if (!(surface instanceof HTMLElement)) throw new TypeError('A viewer surface is required.');
  const assetUrl = new URL(modelUrl, location.href);
  if (assetUrl.origin !== location.origin) throw new Error('The vehicle asset must use the same origin.');
  const fetchController = new AbortController();
  let cancelViewer = null;
  const abortReason = () => fetchController.signal.reason || new DOMException('Viewer loading was canceled.', 'AbortError');
  const externalAbort = () => {
    fetchController.abort(new DOMException('Viewer loading was canceled.', 'AbortError'));
    cancelViewer?.();
  };
  if (signal?.aborted) externalAbort();
  else signal?.addEventListener('abort', externalAbort, { once: true });
  // Import and GLTF parsing cannot be interrupted internally. Reject promptly,
  // prevent scene attachment, and dispose any completed parse that arrives late.
  function abortable(promise, releaseLate) {
    return new Promise((resolve, reject) => {
      let canceled = false;
      const localSignal = fetchController.signal;
      const aborted = () => { canceled = true; localSignal.removeEventListener('abort', aborted); reject(abortReason()); };
      if (localSignal.aborted) aborted();
      else localSignal.addEventListener('abort', aborted, { once: true });
      Promise.resolve(promise).then(value => {
        localSignal.removeEventListener('abort', aborted);
        if (canceled) releaseLate?.(value); else resolve(value);
      }, error => {
        localSignal.removeEventListener('abort', aborted);
        if (!canceled) reject(error);
      });
    });
  }
  let modules;
  try {
    if (fetchController.signal.aborted) throw abortReason();
    modules = await abortable(Promise.all([
      import('/assets/vendor/three-r182/three.module.min.js'),
      import('/assets/vendor/three-r182/OrbitControls.js'),
      import('/assets/vendor/three-r182/loaders/GLTFLoader.js')
    ]));
    if (fetchController.signal.aborted) throw abortReason();
  } catch (error) {
    signal?.removeEventListener('abort', externalAbort);
    throw error;
  }
  const [T, { OrbitControls }, { GLTFLoader }] = modules;
  const events = new AbortController();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let renderer, controls, environment, resizeObserver, model, backgroundTexture;
  let key, fill, hemisphere;
  let constrainingView = false;
  const minimumCameraY = 2.10;
  const environments = {
    studio: {top:'#f4f7fa',bottom:'#d4dde5',glow:'#ffffff',key:'#fffaf2',keyPower:1.75,fill:'#e8f0f6',fillPower:0.30,ambient:0.24,reflection:0.42,shadow:'#526578',opacity:0.20}
  };
  let disposed = false, visible = true, contextLost = false, frame = 0, tween = null;
  let width = 1, height = 1, activePart = 'overview';
  const scene = new T.Scene();
  const root = new T.Group(); scene.add(root);
  const size = new T.Vector3(), center = new T.Vector3();
  const viewBounds = new T.Box3();
  const camera = new T.PerspectiveCamera(35, 1, 0.08, 200);
  const paintMaterials = new Set();
  const proxies = [];
  const pointVector = new T.Vector3(), direction = new T.Vector3(), hit = new T.Vector3();
  const ray = new T.Ray();
  const points = {
    side: new T.Vector3(-3.65, 1.67, 0.85),
    deck: new T.Vector3(0, 1.24, 0.22),
    axles: new T.Vector3(3.65, 0.65, 1.68),
    legs: new T.Vector3(5.43, 2.52, 1.62)
  };
  const focusSpecs = {
    side: { target: [-3.7, 1.42, 0], direction: [-1.25, 0.3, 1.15], extent: [3.9, 1.8, 2] },
    deck: { target: [0.65, 1.2, 0], direction: [-0.55, 1, 1], extent: [5.4, 0.8, 3.5] },
    axles: { target: [3.65, 0.64, 0], direction: [0.65, 0.36, 1], extent: [4.3, 1.9, 3.6] },
    legs: { target: [5.26, 2.14, 0], direction: [1, 0.3, 0.9], extent: [1.9, 4.35, 3.55] }
  };
  let floor;

  // Shared meshes/materials/textures are disposed once; embedded ImageBitmaps are closed.
  function releaseObject(object) {
    const geometries = new Set(), materials = new Set(), textures = new Set(), images = new Set();
    object.traverse(child => {
      if (child.geometry) geometries.add(child.geometry);
      for (const material of child.material ? (Array.isArray(child.material) ? child.material : [child.material]) : []) materials.add(material);
    });
    for (const material of materials) for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    for (const texture of textures) {
      if (texture.source?.data) images.add(texture.source.data);
      texture.dispose();
    }
    for (const image of images) image.close?.();
    materials.forEach(material => material.dispose());
    geometries.forEach(geometry => geometry.dispose());
  }
  function hideHotspots() {
    onHotspots?.(Object.fromEntries(Object.keys(points).map(part => [part, { x: 0, y: 0, visible: false }])));
  }
  function dispose() {
    if (disposed) return;
    disposed = true; tween = null;
    signal?.removeEventListener('abort', externalAbort); cancelViewer = null;
    fetchController.abort(); events.abort(); cancelAnimationFrame(frame); frame = 0;
    resizeObserver?.disconnect(); controls?.dispose();
    releaseObject(scene); environment?.dispose(); backgroundTexture?.dispose();
    key?.shadow.dispose();
    renderer?.dispose(); renderer?.domElement.remove();
    hideHotspots();
  }
  cancelViewer = dispose;
  function requestRender() {
    if (!frame && !disposed && !contextLost && visible && !document.hidden) frame = requestAnimationFrame(render);
  }
  function constrainView() {
    if (!model || !controls || constrainingView) return;
    constrainingView = true;
    try {
      // The approved front deck is below 2 m after grounding. An upper-hemisphere
      // orbit alone is insufficient when zooming toward a low wheel target.
      // This world-height limit also applies to restored views and every frame.
      controls.target.clamp(viewBounds.min,viewBounds.max);
      const offset = camera.position.clone().sub(controls.target);
      if (!offset.toArray().every(Number.isFinite) || offset.lengthSq() < 1e-8) offset.set(-1,0.42,1.25).setLength(controls.minDistance);
      const spherical = new T.Spherical().setFromVector3(offset);
      const rise = Math.max(0,minimumCameraY-controls.target.y);
      spherical.radius = T.MathUtils.clamp(spherical.radius,controls.minDistance,controls.maxDistance);
      spherical.radius = Math.max(spherical.radius,rise/Math.cos(controls.minPolarAngle)+0.00001);
      const heightLimit = Math.acos(T.MathUtils.clamp(rise/spherical.radius,0,1));
      spherical.phi = T.MathUtils.clamp(spherical.phi,controls.minPolarAngle,Math.min(controls.maxPolarAngle,heightLimit));
      camera.position.copy(new T.Vector3().setFromSpherical(spherical).add(controls.target));
      camera.position.y = Math.max(camera.position.y,minimumCameraY);
      camera.lookAt(controls.target);
    } finally { constrainingView = false; }
  }
  function updateView() { controls.update(); constrainView(); }
  function updateHotspots() {
    if (!onHotspots) return;
    const occupied = [], result = {};
    for (const [part, point] of Object.entries(points)) {
      pointVector.copy(point).project(camera);
      const x = (pointVector.x * 0.5 + 0.5) * width;
      const y = (-pointVector.y * 0.5 + 0.5) * height;
      let show = pointVector.z > -1 && pointVector.z < 1 && x > 26 && x < width - 26 && y > 66 && y < height - 76;
      // Constant-cost occlusion against exterior proxy boxes, not dense model triangles.
      if (show) {
        direction.subVectors(point, camera.position).normalize(); ray.set(camera.position, direction);
        const distance = camera.position.distanceTo(point);
        for (const proxy of proxies) {
          if (ray.intersectBox(proxy, hit) && camera.position.distanceTo(hit) < distance - 0.24) { show = false; break; }
        }
      }
      if (show && occupied.some(([px, py]) => Math.hypot(px - x, py - y) < 44)) show = false;
      if (show) occupied.push([x, y]);
      result[part] = { x: Math.round(x), y: Math.round(y), visible: show };
    }
    onHotspots(result);
  }
  function render(now) {
    frame = 0;
    if (disposed || contextLost || !visible || document.hidden) return;
    if (tween) {
      const t = Math.min(1, (now - tween.start) / 600), ease = t * t * (3 - 2 * t);
      camera.position.lerpVectors(tween.from, tween.to, ease);
      controls.target.lerpVectors(tween.fromTarget, tween.target, ease);
      if (t === 1) tween = null;
    }
    updateView();
    renderer.render(scene, camera); updateHotspots();
    if (tween) requestRender();
  }
  function fitDistance(extent, viewDirection, aspect = camera.aspect) {
    const d = viewDirection.clone().normalize();
    const right = new T.Vector3().crossVectors(camera.up, d).normalize();
    const up = new T.Vector3().crossVectors(d, right).normalize();
    const tangent = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    let distance = 0;
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      const corner = new T.Vector3(extent.x * x / 2, extent.y * y / 2, extent.z * z / 2);
      distance = Math.max(distance, Math.abs(corner.dot(right)) / (tangent * aspect) + corner.dot(d), Math.abs(corner.dot(up)) / tangent + corner.dot(d));
    }
    return distance * 1.1;
  }
  function focus(part = 'overview', animate = true) {
    if (!model || disposed) return;
    activePart = Object.hasOwn(focusSpecs,part) ? part : 'overview';
    const spec = focusSpecs[activePart];
    const target = spec ? new T.Vector3(...spec.target).add(root.position) : center.clone();
    const viewDirection = new T.Vector3(...(spec?.direction || [-1, 0.42, 1.25])).normalize();
    const extent = spec ? new T.Vector3(...spec.extent) : size;
    const position = target.clone().addScaledVector(viewDirection, fitDistance(extent, viewDirection));
    if (!animate || reducedMotion.matches) {
      tween = null; camera.position.copy(position); controls.target.copy(target); updateView();
    } else tween = { start: performance.now(), from: camera.position.clone(), fromTarget: controls.target.clone(), to: position, target };
    requestRender();
  }
  function zoom(multiplier) {
    if (!model || disposed || !Number.isFinite(multiplier) || multiplier <= 0) return;
    tween = null;
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(T.MathUtils.clamp(offset.length() * multiplier, controls.minDistance, controls.maxDistance));
    camera.position.copy(controls.target).add(offset); updateView(); requestRender();
  }
  function getViewState() {
    if (!model || disposed) return null;
    updateView();
    return {position:camera.position.toArray(),target:controls.target.toArray(),part:activePart};
  }
  function setViewState(state) {
    const vector = value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
    if (!model || disposed || !vector(state?.position) || !vector(state?.target)) return false;
    const position = new T.Vector3(...state.position), target = new T.Vector3(...state.target);
    const distanceSquared = position.distanceToSquared(target);
    if (!Number.isFinite(distanceSquared) || distanceSquared < 1e-8) return false;
    if (['underside','underbody','runningGear'].includes(state.part)) { focus('overview',false); return true; }
    tween = null; activePart = Object.hasOwn(focusSpecs,state.part) ? state.part : 'overview';
    camera.position.copy(position); controls.target.copy(target); updateView(); requestRender();
    return true;
  }
  function setColor(value) {
    if (disposed) return;
    for (const material of paintMaterials) material.color.set(value);
    requestRender();
  }
  function setEnvironment(id) {
    if (disposed) return;
    // Retain the old API, but all legacy/research names now use the approved
    // clean white studio. No environment selector is exposed in production.
    const preset = environments.studio;
    const backdrop = document.createElement('canvas'); backdrop.width=64;backdrop.height=512;
    const ctx=backdrop.getContext('2d');
    const gradient=ctx.createLinearGradient(0,0,0,512);
    gradient.addColorStop(0,preset.top);gradient.addColorStop(0.52,preset.glow);gradient.addColorStop(1,preset.bottom);
    ctx.fillStyle=gradient;ctx.fillRect(0,0,64,512);
    const texture=new T.CanvasTexture(backdrop);texture.colorSpace=T.SRGBColorSpace;
    backgroundTexture?.dispose();backgroundTexture=texture;scene.background=texture;
    key.color.set(preset.key);key.intensity=preset.keyPower;
    fill.color.set(preset.fill);fill.intensity=preset.fillPower;
    hemisphere.intensity=preset.ambient;scene.environmentIntensity=preset.reflection;
    if(floor){floor.material.color.set(preset.shadow);floor.material.opacity=preset.opacity;}
    renderer.shadowMap.needsUpdate = true;
    requestRender();
  }
  function capture() {
    if (disposed || contextLost || !model) throw new Error('The viewer is not available for capture.');
    updateView();
    // Render and read in the same task; no persistent drawing buffer is needed.
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  }
  function setVisible(value) {
    visible = Boolean(value);
    if (visible) { resize(); requestRender(); }
    else { cancelAnimationFrame(frame); frame = 0; tween = null; hideHotspots(); }
  }
  function resize() {
    if (disposed || !renderer) return;
    const rect = surface.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const oldAspect = camera.aspect, nextAspect = rect.width / rect.height;
    width = rect.width; height = rect.height;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 820 ? 1.5 : 2));
    renderer.setSize(width, height, false);
    camera.aspect = nextAspect; camera.updateProjectionMatrix();
    if (model && Math.abs(oldAspect - nextAspect) > 0.001) {
      // Retain the selected part, target, orbit direction and relative user zoom.
      tween = null;
      const offset = camera.position.clone().sub(controls.target);
      const spec = focusSpecs[activePart], extent = spec ? new T.Vector3(...spec.extent) : size;
      const ratio = fitDistance(extent, offset, nextAspect) / fitDistance(extent, offset, oldAspect);
      offset.setLength(T.MathUtils.clamp(offset.length() * ratio, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset); updateView();
    }
    if (model) constrainView();
    requestRender();
  }

  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.NeutralToneMapping;
    renderer.toneMappingExposure = 1; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.VSMShadowMap;
    renderer.shadowMap.autoUpdate = false;
    const canvas = renderer.domElement;
    canvas.tabIndex = 0; canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', label || '低平板半挂车 3D 外观。方向键旋转，加减键缩放，Home 恢复全车视角。');
    canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.display = 'block';
    surface.replaceChildren(canvas); scene.background = new T.Color(0xe9edf0);
    controls = new OrbitControls(camera, canvas);
    controls.enablePan = false; controls.enableDamping = false; controls.autoRotate = false;
    controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.75;
    controls.minPolarAngle = 0.025; controls.maxPolarAngle = Math.PI * 0.48;
    controls.addEventListener('change', () => { constrainView(); requestRender(); });
    controls.addEventListener('start', () => { tween = null; });
    const studio = new T.Scene();
    studio.add(new T.Mesh(new T.BoxGeometry(36,24,36),new T.MeshBasicMaterial({color:'#505a61',side:T.BackSide})));
    for (const [position, dimensions, brightness] of [
      [[-1,5.5,7],[16,2.08725,0.12],2.52964],
      [[2,6,-6],[13,1.07525,0.12],1.50198],
      [[0,10,-1],[14,0.1,1.8975],1.18577],
      [[2,-1.9,7],[19,0.3036,0.08],3.55731],
      [[-1,-1.4,-7],[17,0.21252,0.08],2.31225],
      [[6.8,-1.6,7],[0.24,5.5,0.08],8],
      [[-6.8,-1.2,-7],[0.20,4.5,0.08],5.6]
    ]) {
      const panel = new T.Mesh(new T.BoxGeometry(...dimensions), new T.MeshBasicMaterial({ color: new T.Color(brightness, brightness, brightness) }));
      panel.position.set(...position); studio.add(panel);
    }
    const pmrem = new T.PMREMGenerator(renderer);
    try { environment = pmrem.fromScene(studio,0.00475); }
    finally { releaseObject(studio); pmrem.dispose(); }
    scene.environment = environment.texture; scene.environmentIntensity = 0.42;
    hemisphere = new T.HemisphereLight(0xf5f7f8,0x737f85,0.24);scene.add(hemisphere);
    key = new T.DirectionalLight(0xfffaf2,1.75);
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.00015; key.shadow.normalBias = 0.007; key.shadow.radius = 29.6; key.shadow.blurSamples = 12;
    scene.add(key, key.target);
    fill = new T.DirectionalLight(0xe8f0f6,0.30);scene.add(fill,fill.target);
    const signal = events.signal;
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); contextLost = true;
      const error = new Error('WebGL context was lost.');
      dispose(); onError?.(error);
    }, { signal });
    canvas.addEventListener('keydown', event => {
      if (!model || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_', 'Home'].includes(event.key)) return;
      event.preventDefault(); tween = null;
      if (event.key === 'Home') { focus('overview'); return; }
      if (['+', '=', '-', '_'].includes(event.key)) { zoom(['+', '='].includes(event.key) ? 0.85 : 1.18); return; }
      const spherical = new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if (event.key === 'ArrowLeft') spherical.theta -= 0.1;
      if (event.key === 'ArrowRight') spherical.theta += 0.1;
      if (event.key === 'ArrowUp') spherical.phi -= 0.1;
      if (event.key === 'ArrowDown') spherical.phi += 0.1;
      spherical.phi = T.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
      camera.position.copy(new T.Vector3().setFromSpherical(spherical).add(controls.target)); updateView(); requestRender();
    }, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; tween = null; }
      else requestRender();
    }, { signal });
    window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { signal });
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(surface); resize();
    const manager = new T.LoadingManager();
    manager.setURLModifier(url => {
      if (/^(data:|blob:)/i.test(url)) return url;
      const resolved = new URL(url, assetUrl);
      if (resolved.origin !== location.origin) throw new Error('Model dependencies must use the same origin.');
      return resolved.href;
    });
    const response = await fetch(assetUrl, { signal: fetchController.signal });
    if (!response.ok) throw new Error(`Vehicle asset request failed (${response.status}).`);
    const data = await response.arrayBuffer();
    if (fetchController.signal.aborted) throw abortReason();
    const gltf = await abortable(new GLTFLoader(manager).parseAsync(data, new URL('.', assetUrl).href), result => releaseObject(result.scene));
    if (disposed) { releaseObject(gltf.scene); throw new DOMException('Viewer was disposed.', 'AbortError'); }
    model = gltf.scene; root.add(model);
    const replacements = new Map();
    model.traverse(object => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const decal = materials.some(m => m.name.startsWith('brand_') && m.name !== 'brand_mudflap');
      const relief = materials.some(m => m.name === 'deck_relief');
      object.castShadow = !decal && !relief;
      object.receiveShadow = !decal && !relief && !materials.some(m => ['painted_frame', 'deck'].includes(m.name));
      if (decal) object.renderOrder = 5;
      const prepared = materials.map(material => {
        if (replacements.has(material)) return replacements.get(material);
        let result = material;
        if (material.name === 'painted_frame') result = new T.MeshPhysicalMaterial({name:material.name,color:material.color,side:material.side,metalness:0.08,roughness:0.20,clearcoat:0.88,clearcoatRoughness:0.065});
        if (material.name === 'painted_recess') {
          result = new T.MeshPhysicalMaterial(); T.MeshStandardMaterial.prototype.copy.call(result,material);
          result.defines = {STANDARD:'',PHYSICAL:''};
          result.metalness=0.06;result.roughness=0.25;result.clearcoat=0.78;result.clearcoatRoughness=0.085;
        }
        if (result.name === 'rubber_tires') { result.color.set('#202328'); result.metalness = 0; result.roughness = 0.94; }
        if (result.name === 'metal_rims') { result.color.set('#c1c5c5'); result.metalness = 0.7; result.roughness = 0.42; }
        if (result.name === 'deck') { result.metalness = 0.08; result.roughness = 0.56; }
        if (result.name === 'deck_relief') { result.metalness = 0.08; result.roughness = 0.40; }
        if (result.name === 'dark_mechanism') { result.color.set('#363e46'); result.metalness = 0.5; result.roughness = 0.58; }
        if (result.name.startsWith('brand_')) {
          const physical = result.name === 'brand_mudflap';
          result.depthWrite = physical; result.polygonOffset = !physical;
          result.polygonOffsetFactor = -1; result.polygonOffsetUnits = -1;
          result.roughness = 0.85; result.metalness = 0; result.toneMapped = false;
        }
        if (['painted_frame', 'painted_recess', 'deck', 'deck_relief'].includes(result.name)) paintMaterials.add(result);
        replacements.set(material, result); return result;
      });
      object.material = Array.isArray(object.material) ? prepared : prepared[0];
    });
    for (const [old, replacement] of replacements) if (old !== replacement) old.dispose();
    const box = new T.Box3().setFromObject(root, true);
    if (box.isEmpty() || ![...box.min, ...box.max].every(Number.isFinite)) throw new Error('The model has invalid bounds.');
    box.getCenter(center); root.position.set(-center.x, -box.min.y, -center.z); root.updateMatrixWorld(true);
    box.setFromObject(root, true); box.getSize(size); box.getCenter(center); viewBounds.copy(box);
    const radius = size.length() / 2;
    camera.near = Math.max(radius / 100, 0.001); camera.far = radius * 30; camera.updateProjectionMatrix();
    controls.minDistance = radius * 0.18; controls.maxDistance = radius * 18;
    for (const point of Object.values(points)) point.add(root.position);
    for (const [min, max] of [
      [[-5.74, 1.55, -0.825], [-2.75, 1.94, 0.825]],
      [[-2.15, 1.10, -1.63], [5.64, 1.21, 1.63]],
      [[2.2, 0.22, -1.61], [5.30, 1.04, -0.95]],
      [[2.2, 0.22, 0.95], [5.30, 1.04, 1.61]]
    ]) proxies.push(new T.Box3(new T.Vector3(...min).add(root.position), new T.Vector3(...max).add(root.position)));
    floor = new T.Mesh(new T.PlaneGeometry(radius * 30, radius * 30), new T.ShadowMaterial({ color: '#526578', opacity:0.20, depthWrite:false }));
    // VSM needs receiver depth for its soft penumbra. Keep the transparent floor
    // in that pass and only fade its numerical seam at the light-frustum edge.
    floor.material.onBeforeCompile = shader => {
      const chunk = T.ShaderChunk.shadowmap_pars_fragment;
      const start = chunk.indexOf('#elif defined( SHADOWMAP_TYPE_VSM )');
      const end = chunk.indexOf('return mix( 1.0, shadow, shadowIntensity );',start);
      const fade = 'float studioShadowEdge = min(min(shadowCoord.x,1.0-shadowCoord.x),min(shadowCoord.y,1.0-shadowCoord.y));\nstudioShadowEdge = min(studioShadowEdge,min(shadowCoord.z,1.0-shadowCoord.z));\nshadowIntensity *= smoothstep(0.0,0.03,studioShadowEdge);\n';
      shader.fragmentShader = shader.fragmentShader.replace('#include <shadowmap_pars_fragment>',chunk.slice(0,end)+fade+chunk.slice(end));
    };
    floor.material.customProgramCacheKey = () => 'white-studio-shadow-edge-v1';
    floor.rotation.x = -Math.PI / 2; floor.position.y = -radius * 0.002; floor.receiveShadow = true; scene.add(floor);
    key.position.copy(center).add(new T.Vector3(-0.6,1,1.45).multiplyScalar(radius)); key.target.position.copy(center);
    fill.position.copy(center).add(new T.Vector3(0.8,0.5,-1.3).multiplyScalar(radius)); fill.target.position.copy(center);
    key.shadow.camera.left = key.shadow.camera.bottom = -radius * 1.35;
    key.shadow.camera.right = key.shadow.camera.top = radius * 1.35;
    key.shadow.camera.near = radius * 0.1; key.shadow.camera.far = radius * 6; key.shadow.camera.updateProjectionMatrix();
    setEnvironment(initialEnvironment);setColor(color); focus('overview', false);
    return {canvas,focus,zoom,getViewState,setViewState,setColor,setEnvironment,setVisible,capture,dispose};
  } catch (error) {
    dispose();
    throw error;
  }
}
