# V13 public exterior viewer

`lowbed-viewer.js` exports the asynchronous function:

```js
const engine = await createLowbedViewer({
  surface: document.getElementById('renderSurface'),
  color: '#247bc1',
  environment: 'studio', // Optional; studio is the default.
  modelUrl: '/assets/models/jdv9382tdp-exterior-v13.glb',
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
`setEnvironment(id)`, `setVisible(boolean)`, `capture()`, `dispose()`.
`dispose()` is idempotent. Hiding stops rendering;
showing remeasures the surface. An initially hidden surface is supported.

`setEnvironment(id)` changes the gradient backdrop, lighting and shadow-floor
appearance without changing the camera, paint or geometry. Unknown ids fall back
to `studio`. The current environment is a viewing preference, not an inquiry
option. Hosts must preserve the latest choice while an asynchronous load finishes.

| Environment id | UI name |
| --- | --- |
| studio | 浅灰展厅 / Light studio (default) |
| graphite | 深色展厅 / Dark studio |
| daylight | 暖光展台 / Warm studio |

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
| underside | Closed gooseneck underside retained from V12 |
| underbody | Whole underbody, main beams, crossmembers and three axles |
| runningGear | Axles and simplified mechanical suspension |

The camera can orbit below the vehicle. The shadow floor hides when the camera
is below its plane, with a fill light for underside inspection. The vehicle and
wheels stay in place; the focus views do not unfold or modify the model. The new
focus names are button targets; `onHotspots` still reports only the four original
side/deck/axles/legs anchors.

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
is based on the standalone review, with the three display environments above.
Thin frame/deck surfaces do not
receive their own shadow, and embossed grain neither casts nor receives shadow.

Both hosts share `window.OYJD_3D.normalizeColor(value)`: exactly six hex digits
with an optional leading `#` return uppercase `#RRGGBB`; other values return
`null`. Validate visitor input before passing it to `setColor`. A custom-color
link uses `paint=custom&customColor=RRGGBB`; a classic link uses its known paint
id and omits `customColor`. The configurator selects its existing `其他` radio
for a valid custom color. Its controlled `customScreenColor` value is used only
to append `屏幕配色参考 #RRGGBB，以色卡确认为准` to the returned inquiry remarks
when that radio is selected. The customer's textarea is never changed; repeated
reads do not duplicate the line, and classic paints do not add it. Environment
selection is not submitted. Full form behavior is documented in
[vehicle-experience.md](vehicle-experience.md).

The host HTML needs its existing import map mapping `three` to
`/assets/vendor/three-r182/three.module.min.js`. Added local r182 dependencies are
`loaders/GLTFLoader.js` and `utils/BufferGeometryUtils.js`; copied byte-for-byte
from the already tested standalone package. Their MIT license is the existing
`assets/vendor/three-r182/LICENSE`. No CDN runtime requests or decoder are needed.

V13 display GLB SHA256:
`93fc6bb383231a262dd644d1f4b0fd7b57fa2b8b8429bf47eb38aa898f5a9516`.
8,825,500 bytes; 300,202 triangles; 22 meshes; 14 materials. Triangle count sums
the index count divided by three for each TRIANGLES primitive. Local glTF
Validator result: 0 errors / 0 warnings (13 informational messages).

V13 adds generic axle bodies, leaf-spring packs, clamps, hangers, equalizers and
links while retaining the V12 exterior outline and dimensions of the display
asset. Eighteen retained V12 nodes have byte-identical geometry attributes and
indices, and the whole-vehicle bounding box is unchanged. Three old plain axle
tubes were removed from the remaining original mechanism node. New parts reuse
the existing paint and mechanism materials. Wheel backs are neutral closed
shells; they do not establish a drum/disc brake specification. This is an
independently authored exterior illustration, not imported engineering geometry,
an exact certified configuration or a production drawing.

Validation must include syntax checks plus real desktop/mobile rendering, all
focus views, classic/custom color changes, environments, photo fallback,
hide/show, cancellation and language text. Asset and offline checks do not
establish browser acceptance or production deployment.
