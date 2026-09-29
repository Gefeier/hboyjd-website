# Interactive vehicle exteriors

Two display routes share the bilingual experience page. Three.js is pinned to
r182 / 0.182.0, MIT, and served locally under `assets/vendor/three-r182/`.

| Route | Display | Specification page |
| --- | --- | --- |
| `/vehicle-experience.html` | Existing procedural drop-side illustration | `/vehicles/EHJ9400LB.html` |
| `/vehicle-experience.html?model=JDV9382TDP` | Lowbed exterior GLB, V13 | `/vehicles/JDV9382TDP.html` |

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
`assets/models/jdv9382tdp-exterior-v13.glb`, through `lowbed-viewer.js`. It shows the
raised gooseneck, closed underside, cargo deck, three-axle wheel group and twin
loading ramps, with generic axle and mechanical-suspension detail beneath the
vehicle. V13 retains the V12 body outline, narrowed gooseneck, side rails, closed
front underside, wheels, ramps and branding. The new underbody includes axle
bodies, leaf springs, clamps, hangers, equalizers and links. These describe a
display arrangement, not confirmed equipment for an individual delivered vehicle.
Wheel backs are neutral closed shells; no drum/disc brake type is established.
Photographs informed the exterior; it is not a production
CAD conversion, measured manufacturing model or exact certified configuration.
Its screen proportions are not product measurements. Options, dimensions and
delivery details remain subject to the actual vehicle and order.

The initial lowbed poster at `assets/images/3d/jdv9382tdp-red-v13.webp` is rendered from
this actual display model in Jude Red. Photo mode uses
`assets/images/3d/jdv9382tdp-photo.webp` and keeps the original photo colors.
Asset URLs and the common paint palette are defined in `vehicle-3d-data.js`.

Only the approved exterior GLB and public image assets belong in this release.
Private drawings, STEP/SolidWorks sources, study linework, engineering component
maps and earlier CAD-derived conversions are not public assets. Any browser GLB
is downloadable; the protection comes from authoring a separate display model,
not from making browser geometry inaccessible. This GLB contains no external
resource URI, extras, source paths or drawing metadata.

## Loading and interaction

The first page view displays its static launch image. Three.js, OrbitControls,
GLTFLoader and the lowbed GLB load only when the visitor activates 3D or selects
a 3D option. The uncompressed V13 is **8,825,500 bytes (about 8.8 MB), 300,202
triangles, 22 meshes and 14 materials**. It adds the new underbody detail while
preserving V12's exterior geometry and embedded textures; no lossy mesh
compression or automatic model
download on first page view is required. No runtime request goes to a CDN.

- Drag / one finger orbits; wheel / pinch zooms. Buttons provide zoom and reset.
- Focused canvas supports arrow keys, plus/minus and Home.
- Lowbed focus points cover gooseneck, deck, axle group and loading ramps, with
  separate gooseneck underside (`underside`), whole underbody (`underbody`) and
  axle/suspension (`runningGear`) views. The camera can orbit beneath the vehicle;
  the shadow floor hides below its plane rather than moving the model or wheels.
  The original route retains its sideboard,
  deck, axle and landing-leg focus areas.
- Hotspot and paint controls are native keyboard-accessible buttons. Lowbed
  hotspot occlusion uses a few analytic boxes, not a raycast over every mesh.
- Language switches update text and links without rebuilding the model.
- Lowbed display environments are `studio` (浅灰展厅 / Light studio, default),
  `graphite` (深色展厅 / Dark studio) and `daylight` (暖光展台 / Warm studio).
  Switching changes backdrop, lights and floor appearance while retaining the
  camera, selected finish and geometry. Environments are not inquiry options.
- Rendering occurs on interaction, resizing and short focus transitions. There
  is no auto-rotation; reduced motion skips transitions. Hidden views stop
  rendering, and canvas pixel ratio is capped at 1.5 for small surfaces and 2
  otherwise. Lowbed resizing retains the selected local view.
- Failed imports, fetches, parsing or WebGL context loss fall back to the photo.
- The lowbed loader accepts an AbortSignal. Model changes cancel the download;
  stale parsing results are disposed rather than attached. Caller generation
  checks remain necessary. Deliberate cancellation does not show failure UI.

The lowbed is already Y-up with nose toward -X. Only centering and grounding are
applied. Preserve the display-environment setup, material values and thin-surface
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
a recognized classic paint id or the validated custom-color pair. Color and
environment changes retain the current view. Choices made during loading are
reapplied after the viewer resolves. Length, suspension and other structural form
options do not change the display geometry; the page retains its illustration
notice, and incompatible axle/ramp selections still remove the viewer.
The public specification page and actual order remain the source of product
parameters; the display model does not redefine them.

## Verification and release boundary

Syntax checks: `node --check` for `vehicle-experience.js`, `lowbed-viewer.js`,
`vehicle-3d-data.js` and `configurator-3d.js`. Browser acceptance must also cover:
desktop and 375 px layouts, all focus areas including the whole underbody and
suspension, classic/free paint selection, HEX validation, environments, keyboard reset,
language changes (including during loading), photo/3D switching, reduced motion,
load failure, context loss and canceled/stale configurator loads. Confirm a fresh
page does not request the GLB until 3D is requested, and changing model during a
download does not leave a canvas or failure message for the old vehicle.

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

The offline configurator adapter passes 59 assertions for cancellation/late
results, color and environment changes during loading, strict HEX/URL validation,
classic/custom form synchronization and stable remarks composition. It does not
render WebGL or send inquiry requests.

This records local asset and implementation checks, not a claim that browser
acceptance or production deployment has already completed. Deployment must
publish the approved public files only and read back the actual route, model
hash, dependencies and fallback behavior.
