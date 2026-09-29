# Interactive vehicle exteriors

Two display routes share the bilingual experience page. Three.js is pinned to
r182 / 0.182.0, MIT, and served locally under `assets/vendor/three-r182/`.

| Route | Display | Specification page |
| --- | --- | --- |
| `/vehicle-experience.html` | Existing procedural drop-side illustration | `/vehicles/EHJ9400LB.html` |
| `/vehicle-experience.html?model=JDV9382TDP` | Lowbed exterior GLB, V14 | `/vehicles/JDV9382TDP.html` |

Add `lang=en` for English, and optionally `paint=<id>` for a selected finish. For
example: `/vehicle-experience.html?model=JDV9382TDP&paint=jude-red&lang=en`.
For a free screen color, use `paint=custom&customColor=RRGGBB`, for example
`/vehicle-experience.html?model=JDV9382TDP&paint=custom&customColor=286B82&lang=en`.
The page is maintained separately from `scripts/build_english.py`.

## Display assets and scope

The original EHJ9400LB route builds a simplified straight drop-side exterior in
`vehicle-experience.js`: six sideboard sections, a tall front board and three
axles. It is not an exact CAD, scanned model or certified delivery configuration.
Its photo remains the same-series image at `assets/images/products/fence/01.webp`;
that photo shows a different deck variant and must not be described as this exact
model.

The JDV9382TDP route uses the independently authored exterior at
`assets/models/jdv9382tdp-exterior-v14.glb`, through `lowbed-viewer.js`. It shows the
raised gooseneck, closed underside, cargo deck, three-axle wheel group and twin
loading ramps, with generic axle and mechanical-suspension detail beneath the
vehicle. V14 refines seven visible front components: the two gooseneck side webs,
their lower flanges and upper lips, and the closed underside skin. The front web
remains shallow at the nose and deepens along a curved lower edge; flange layers
and small bevels improve edge reflections. Approved exterior proportions, front
width, closed bottom, wheels, deck, ramps and branding remain unchanged. V13's
generic axle bodies, leaf springs, clamps, hangers, equalizers and links remain
in the asset, but there are no public underbody inspection controls. These describe a
display arrangement, not confirmed equipment for an individual delivered vehicle.
Wheel backs are neutral closed shells; no drum/disc brake type is established.
Photographs informed the exterior; it is not a production
CAD conversion, measured manufacturing model or exact certified configuration.
Its screen proportions are not product measurements. Options, dimensions and
delivery details remain subject to the actual vehicle and order.

The lowbed launch poster is `assets/images/3d/jdv9382tdp-red-v14.webp`, rendered from
the approved V14 display model in Jude Red with the public studio lighting. Photo mode uses
`assets/images/3d/jdv9382tdp-photo.webp` and keeps the original photo colors.
Asset URLs and the common paint palette are defined in `vehicle-3d-data.js`.

Only the approved exterior GLB and public image assets belong in this release.
Private drawings, STEP/SolidWorks sources, study linework, engineering component
maps and earlier CAD-derived conversions are not public assets. Any browser GLB
is downloadable; the protection comes from authoring a separate display model,
not from making browser geometry inaccessible. This GLB contains no external
resource URI, extras, source paths or drawing metadata. The V14 builder reads the
approved public V13 asset and authors replacement display geometry; it does not
import original CAD geometry. Camera restrictions are a presentation boundary,
not data redaction or a claim of confidentiality.

## Loading and interaction

The first page view displays its static launch image. Three.js, OrbitControls,
GLTFLoader and the lowbed GLB load only when the visitor activates 3D or selects
a 3D option. The uncompressed V14 is **9,915,920 bytes (about 9.9 MB), 305,194
triangles, 29 meshes and 14 materials**. It replaces only the seven front
components while preserving all other V13 geometry and embedded textures; no lossy mesh
compression or automatic model
download on first page view is required. No runtime request goes to a CDN.

- Drag / one finger orbits; wheel / pinch zooms. Buttons provide zoom and reset.
- Focused canvas supports arrow keys, plus/minus and Home.
- Lowbed exposes only five exterior focus ids: `overview`, `side` (gooseneck),
  `deck`, `axles` (wheel-group exterior) and `legs` (loading ramps). Removed ids
  `underside`, `underbody` and `runningGear` resolve to `overview`; they have no
  public buttons or detail panels. The camera is constrained to exterior
  viewing: polar angle is at most 86.4 degrees and world camera Y is at least
  2.10 in the grounded display scene. The target is bounded to the model, and
  close zooms tighten the angle or distance as necessary. Shared constraints
  apply to dragging, touch, keyboard, zoom, focus, restored view state, resize
  and capture. These are display coordinates, not vehicle measurements.
  The original route retains its sideboard,
  deck, axle and landing-leg focus areas.
- Hotspot and paint controls are native keyboard-accessible buttons. Lowbed
  hotspot occlusion uses a few analytic boxes, not a raycast over every mesh.
- Language switches update text and links without rebuilding the model.
- Lowbed uses one clean white/light-grey `studio` background and the approved
  lab glossy baked-paint response. There is no public environment selector or
  atelier dark-band environment. `setEnvironment(id)` remains compatible with
  older hosts but every id resolves to `studio`, retaining camera, finish and
  geometry. Lighting experiments are not public options or inquiry fields.
- Rendering occurs on interaction, resizing and short focus transitions. There
  is no auto-rotation; reduced motion skips transitions. Hidden views stop
  rendering, and canvas pixel ratio is capped at 1.5 for small surfaces and 2
  otherwise. Lowbed resizing retains the selected local view.
- Failed imports, fetches, parsing or WebGL context loss fall back to the photo.
- The lowbed loader accepts an AbortSignal. Model changes cancel the download;
  stale parsing results are disposed rather than attached. Caller generation
  checks remain necessary. Deliberate cancellation does not show failure UI.

The lowbed is already Y-up with nose toward -X. Only centering and grounding are
applied. Preserve the fixed studio setup, glossy paint values and thin-surface
shadow handling when integrating another host. Full module API, screenshot and
lifecycle details are in [lowbed-viewer-contract.md](lowbed-viewer-contract.md).

## Shared classic paint palette

Both the experience page and configurator use the existing named screen colors
from `vehicle-3d-data.js`; do not maintain a separate set of hex values per page.

| Paint id | Name |
| --- | --- |
| jude-red | 聚德大红 / Jude Red |
| flame-red | 赤焰红 / Flame Red |
| orange | 桔红 / Orange |
| jude-yellow | 聚德黄 / Jude Yellow |
| white | 白色 / White |
| silver | 银灰 / Silver Grey |
| light-blue | 淡蓝色 / Light Blue |
| dongyue-blue | 东岳蓝 / Dongyue Blue |
| green | 苹果绿 / Apple Green |
| black | 黑色 / Black |

On the lowbed, paint changes affect `painted_frame`, `painted_recess`, `deck` and
`deck_relief` together. Tires, rims, lights, reflectors and brand marks keep their
own materials. The original drop-side model keeps its separate deck material.
Screen colors, including labels associated with RAL names, are illustrative;
the physical color sample controls the final finish.

Free color uses a native color picker and a HEX field alongside the classic
palette. Both hosts call `window.OYJD_3D.normalizeColor(value)`: a string of exactly
six hexadecimal digits, optionally prefixed with `#`, becomes uppercase
`#RRGGBB`; all other values return `null`. An invalid draft does not replace the
last valid screen color. Free-color links carry `paint=custom` and the six digits
in `customColor`; classic links omit that parameter. Unknown paint ids and invalid
URL color values cannot set arbitrary configurator data. HEX is a screen preview
value, not a physical paint code or an additional RAL specification.

## Configurator association

`configurator-3d.js` is an optional display layer; quotation data and submission
remain in `configurator.js`. The viewer appears only when all of these current
form conditions hold:

- `modelDirect` is exactly `JDV9382TDP`.
- `vehicleType` is `高低平板` and `variant` is `三轴低平板`.
- Axles are either not yet selected or `3轴`.
- The ramp option is either not yet selected or `机械爬梯`.

A different model or an incompatible axle/ramp selection removes the preview,
aborts its pending load and disposes the current viewer. Do not reuse this GLB
for other models just because they are lowbeds. A generation token and separate
load surface prevent a late result from replacing a newer selection.

Paint buttons use the existing color form options, preserving the selected
configuration. Classic palette and form radio changes synchronize both ways.
A valid free color selects the existing `其他` radio and stores only its normalized
HEX in the controlled hidden `customScreenColor` field. Selecting a classic color
clears that field. Selecting `其他` without a valid HEX keeps the existing request
for color-sample confirmation and uses Jude Red as a labeled temporary preview.

`getSelections()` leaves the customer's textarea untouched. Only when the selected
radio is `其他` and `customScreenColor` is valid does it append one line to the
returned remarks: `屏幕配色参考 #RRGGBB，以色卡确认为准`. Repeated summary/submission
reads produce the same line without accumulating it in the textarea, and an
identical existing line is not duplicated. Classic colors do not add a reference
line. Summary and inquiry use the same returned value; no separate HEX order
field or environment field is submitted. Existing user remarks are preserved.

Links between the full experience and configurator carry the model and either
a recognized classic paint id or the validated custom-color pair. Color changes
retain the current view. Color choices made during loading are
reapplied after the viewer resolves. Length, suspension and other structural form
options do not change the display geometry; the page retains its illustration
notice, and incompatible axle/ramp selections still remove the viewer.
The public specification page and actual order remain the source of product
parameters; the display model does not redefine them.

## Verification and release boundary

Syntax checks: `node --check` for `vehicle-experience.js`, `lowbed-viewer.js`,
`vehicle-3d-data.js` and `configurator-3d.js`. Browser acceptance must also cover:
desktop and 375 px layouts, all five exterior focus areas, absence of removed
underbody controls, the camera boundary across pointer/touch/keyboard/zoom and
restored view state, classic/free paint selection, HEX validation, fixed studio,
keyboard reset,
language changes (including during loading), photo/3D switching, reduced motion,
load failure, context loss and canceled/stale configurator loads. Confirm a fresh
page does not request the GLB until 3D is requested, and changing model during a
download does not leave a canvas or failure message for the old vehicle.

Local V14 asset checks on 2026-09-29:

- SHA256: `99dcbbf3f938dd8b471ecf6e2ef2720d4daeeed97866371b4ed3aff3afbb6221`.
- 9,915,920 bytes; glTF Validator 0 errors / 0 warnings (14 informational messages).
- 29 meshes, 14 materials, 305,194 triangles, counted as each TRIANGLES
  primitive's index count divided by three.
- Seven front components replace 1,164 old triangles with 6,156 new triangles.
  The other 61,616 triangles of the original painted-frame primitive retain
  their index values and order; the other 21 meshes are unchanged.
- The original 8,804,820-byte binary buffer is an identical prefix. All 77 old
  accessors, original node definitions, materials, textures, images and samplers
  are preserved. The four embedded brand PNGs retain their hashes.
- Whole-vehicle bounds are unchanged. The seven new components are closed
  connected solids, with no boundary edges, non-manifold edges or zero-area
  triangles in the independent geometry readback.
- No external URI fields, extras, source paths or engineering file references.

### Historical V13 / v2.10 checks

The following records the earlier V13 asset and the v2.10 interaction scope.
That release offered gooseneck-underside, whole-underbody and running-gear views,
and three environment choices. Their past verification does not describe the
current public controls or prove the new camera boundary.

Local V13 asset checks on 2026-09-29:

- SHA256: `93fc6bb383231a262dd644d1f4b0fd7b57fa2b8b8429bf47eb38aa898f5a9516`.
- 8,825,500 bytes; glTF Validator 0 errors / 0 warnings (13 informational messages).
- Valid GLB header; 22 meshes, 14 materials, 300,202 triangles, counted as
  each TRIANGLES primitive's index count divided by three.
- Eighteen retained V12 nodes have byte-identical geometry attributes and indices;
  the whole-vehicle bounding box is unchanged. The remaining original mechanism
  node only loses three plain axle tubes. Added underbody parts use existing
  material slots and preserve wheel/axle placement and exterior proportions.
- No URI fields, extras, Windows/UNC paths or engineering file references.
- Four embedded brand PNGs contain only IHDR / IDAT / IEND chunks; no text or
  EXIF chunks. The only asset-level metadata is glTF version and Blender exporter
  version.

The earlier offline configurator adapter passed 59 assertions for cancellation/late
results, color and environment changes during loading, strict HEX/URL validation,
classic/custom form synchronization and stable remarks composition. It does not
render WebGL or send inquiry requests.

This records local asset and implementation checks, not a claim that browser
acceptance or production deployment has already completed. Deployment must
publish the approved public files only and read back the actual route, model
hash, dependencies and fallback behavior.
