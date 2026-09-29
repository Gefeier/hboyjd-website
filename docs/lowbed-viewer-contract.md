# V12 public exterior viewer

`lowbed-viewer.js` exports the asynchronous function:

```js
const engine = await createLowbedViewer({
  surface: document.getElementById('renderSurface'),
  color: '#247bc1',
  modelUrl: '/assets/models/jdv9382tdp-exterior-v12.glb',
  label: 'Localized canvas keyboard instructions',
  signal: loadController.signal, // Optional AbortController owned by this load.
  onError(error) { /* Show the photo fallback; dispose is already done. */ },
  onHotspots(points) { /* Optional: side/deck/axles/legs -> {x,y,visible}. */ }
});
```

Call it only on a visitor's request for 3D. The promise rejects on import, fetch,
parse or setup failure; the caller must catch that rejection and show its photo
fallback. `onError` handles later WebGL context loss. A lost context disposes the
engine; clear the caller's engine reference before retrying with a new instance.

Optional `signal` supports cancellation before creation, during imports/fetch/
parsing, and after the engine is returned. Cancellation rejects pending creation
with `AbortError`, stops the model fetch immediately, and disposes the viewer.
It does not call `onError`. Imports and already started GLTF parsing cannot be
physically stopped; late parsed scene resources are disposed without attachment.
The host should abort its controller on a model change, retain its generation
token check, and suppress error UI for canceled/stale loads. Remove the old
engine reference when canceling it. Each new attempt requires a new controller.

Returned API: `canvas`, `focus(part)`, `zoom(multiplier)`, `setColor(numberOrCSS)`,
`setVisible(boolean)`, `capture()`, `dispose()`. `dispose()` is idempotent. Hiding stops rendering;
showing remeasures the surface. An initially hidden surface is supported.

`capture()` synchronously renders the current scene/camera and returns a PNG data
URL with `canvas.toDataURL('image/png')`. The renderer does not keep
`preserveDrawingBuffer` enabled. For a deterministic new viewpoint, use
`focus(part, false)` to skip its transition before capturing, or wait for the
transition to finish. Make the surface visible first so its canvas has the
intended resolution. Capture throws if the viewer has been disposed or its
WebGL context is lost. This API does not require a public save button.

Focus names:

| Name | Area |
| --- | --- |
| overview | Whole vehicle |
| side | Raised front platform and gooseneck |
| deck | Cargo deck and raised tread |
| axles | Rear three-axle group |
| legs | Twin loading ramps; this key no longer means landing legs |
| underside | Newly closed gooseneck underside |

Hotspot coordinates are CSS pixels relative to `surface`, not the page. The
caller owns its buttons and text. Four analytic Box3 proxies provide approximate
occlusion; no ray is tested against the dense GLB triangles. Focus buttons remain
available even when a hotspot is hidden. Resizing preserves the selected area,
orbit direction, target and relative zoom. There is no continuous animation;
reduced-motion preference skips focus transitions. Canvas arrow keys orbit,
plus/minus zoom, and Home restores overview.

The asset is Y-up, nose -X, tail +X. The viewer only recenters and grounds it;
there is no axis rotation, rescaling, remeshing or geometry modification.

Paint changes match these exact material names: `painted_frame`, `painted_recess`,
`deck`, `deck_relief`. Tires, rims, lamps, reflectors and brand textures retain their
independent appearance. `brand_mudflap` is physical black rubber geometry and is
not treated as a transparent decal. The verified studio light and material setup
is carried over from the standalone review. Thin frame/deck surfaces do not
receive their own shadow, and embossed grain neither casts nor receives shadow.

The host HTML needs its existing import map mapping `three` to
`/assets/vendor/three-r182/three.module.min.js`. Added local r182 dependencies are
`loaders/GLTFLoader.js` and `utils/BufferGeometryUtils.js`; copied byte-for-byte
from the already tested standalone package. Their MIT license is the existing
`assets/vendor/three-r182/LICENSE`. No CDN runtime requests or decoder are needed.

Approved GLB SHA256:
`5686d6e35a70053010db74aa31304941f7afbe024be557fbde26f3658db4d085`.
7,217,396 bytes; 242,466 triangles; 19 meshes; 14 materials. This is an exterior
illustration, not an exact certified configuration or production drawing.

Validation here: all three new JavaScript files pass `node --check`. Parent
integration must additionally verify real desktop/mobile rendering, focus views,
color changes, photo fallback, hide/show, and language text. Do not infer browser
acceptance from syntax checks.
