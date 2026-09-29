# V14 public exterior viewer

Current release scope: V14 front geometry, the original clean white/light-grey
studio backdrop, and the approved lab's glossy baked-paint appearance. Public
interaction is limited to exterior viewing. The lab's atelier/dark-band scene,
lighting controls, and below-vehicle inspection are not part of this release.

`lowbed-viewer.js` exports the asynchronous function:

```js
const engine = await createLowbedViewer({
  surface: document.getElementById('renderSurface'),
  color: '#247bc1',
  environment: 'studio', // Optional; studio is the default.
  modelUrl: '/assets/models/jdv9382tdp-exterior-v14.glb',
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
`getViewState()`, `setViewState(state)`, `setEnvironment(id)`,
`setVisible(boolean)`, `capture()`, `dispose()`.
`dispose()` is idempotent. Hiding stops rendering;
showing remeasures the surface. An initially hidden surface is supported.

`setEnvironment(id)` remains available for host compatibility, but every id
resolves to the single approved `studio` presentation, including obsolete or
unknown ids. It preserves camera, paint, and geometry. Hosts expose no environment
selector and do not submit an environment in an inquiry. The fixed presentation
uses the original clean white/light-grey gradient, without the lab's atelier
dark band or an additional selectable environment.

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

These are the only five supported focus names. Removed `underside`, `underbody`,
and `runningGear` names follow the unsupported-name fallback to `overview`;
they must not create inspection buttons or translated detail text in either host.
`onHotspots` still reports only the four side/deck/axles/legs anchors.

The camera stays in the exterior viewing envelope: maximum polar angle is
`0.48 * Math.PI` (86.4 degrees), minimum world camera Y is `2.10`, and the target
is clamped to the grounded model bounds. Near a low target, the height floor
further tightens the polar angle or required distance. These are display-scene
values, not product measurements. The same constraint applies after pointer,
touch, keyboard, zoom, focus transitions, restored view state and resize
operations, and before capture. The vehicle and wheels stay in place; focus views do not unfold or
modify the model. This is a presentation constraint, not geometry redaction or
a confidentiality mechanism: a browser still receives a downloadable GLB.

`getViewState()` returns `{position, target, part}` with finite three-number
vectors, or `null` after disposal. `setViewState(state)` rejects invalid or
coincident position/target vectors with `false`; accepted states return `true`
and pass through the same camera constraint. A saved `underside`, `underbody`
or `runningGear` state restores overview instead of its old camera position.

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
not treated as a transparent decal. The fixed studio uses the approved lab's
glossy baked-paint response with the original clean studio background. It does
not expose the lab's experimental environments or lighting adjustments.
`painted_frame` uses metalness / roughness / clearcoat / clearcoat roughness
`0.08 / 0.20 / 0.88 / 0.065`; `painted_recess` uses
`0.06 / 0.25 / 0.78 / 0.085`. Deck and tread roughness remain `0.56` and `0.40`,
so the cargo surface is not treated as glossy body paint. Thin frame/deck surfaces do not
receive their own shadow, and embossed grain neither casts nor receives shadow.

Both hosts share `window.OYJD_3D.normalizeColor(value)`: exactly six hex digits
with an optional leading `#` return uppercase `#RRGGBB`; other values return
`null`. Validate visitor input before passing it to `setColor`. A custom-color
link uses `paint=custom&customColor=RRGGBB`; a classic link uses its known paint
id and omits `customColor`. The configurator selects its existing `其他` radio
for a valid custom color. Its controlled `customScreenColor` value is used only
to append `屏幕配色参考 #RRGGBB，以色卡确认为准` to the returned inquiry remarks
when that radio is selected. The customer's textarea is never changed; repeated
reads do not duplicate the line, and classic paints do not add it. No environment
selection is offered or submitted. Full form behavior is documented in
[vehicle-experience.md](vehicle-experience.md).

The host HTML needs its existing import map mapping `three` to
`/assets/vendor/three-r182/three.module.min.js`. Added local r182 dependencies are
`loaders/GLTFLoader.js` and `utils/BufferGeometryUtils.js`; copied byte-for-byte
from the already tested standalone package. Their MIT license is the existing
`assets/vendor/three-r182/LICENSE`. No CDN runtime requests or decoder are needed.

V14 display GLB SHA256:
`99dcbbf3f938dd8b471ecf6e2ef2720d4daeeed97866371b4ed3aff3afbb6221`.
9,915,920 bytes; 305,194 triangles; 29 meshes; 14 materials. Triangle count sums
the index count divided by three for each TRIANGLES primitive. Local glTF
Validator result: 0 errors / 0 warnings (14 informational messages).

V14 replaces seven public V13 front pieces: two tapered side webs, two lower
flanges, two upper returns, and the matching closed underside skin. Original
display profile knots and the whole-vehicle bounds are retained; smooth
interpolation and small bevels refine the visible edge layers. The front bounds
differ only by about 0.00001097 display units at the bevelled lower corner.
The remaining 61,616 original frame triangles retain their index order, all
21 other original meshes and their accessors remain identical, and all original
materials and four embedded brand PNGs are unchanged. The original binary is an
identical prefix of the new buffer.

The V13 generic mechanical components remain in the display asset, but the public
viewer no longer offers their inspection views. Wheel backs are neutral closed
shells and do not establish a drum/disc brake specification. Company reference
thumbnails informed only qualitative shape; no original CAD, private coordinate
map, engineering mesh, manufacturing dimension or source hole pattern was
imported. This remains an independently authored exterior illustration, not an
exact certified configuration or a production drawing.

## Historical scope

The preceding V13 / v2.10 interaction included `underside`, `underbody`, and
`runningGear` views, below-vehicle orbit, and three selectable environments.
Those earlier validation results are historical and do not describe the current
public contract. V13 asset SHA256 was
`93fc6bb383231a262dd644d1f4b0fd7b57fa2b8b8429bf47eb38aa898f5a9516`
(8,825,500 bytes, 300,202 triangles, 22 meshes, 14 materials; validator 0 errors /
0 warnings). Retain deployment records as dated history rather than overwriting
them with V14 results.

Current validation must include syntax checks plus real desktop/mobile rendering,
all five exterior focus views, absence of the removed inspection/environment
controls, and the camera boundary under pointer, touch, keyboard, zoom, resize,
and capture. Also check classic/custom color changes, photo fallback, hide/show,
cancellation and language text. Asset and offline checks do not
establish browser acceptance or production deployment.
