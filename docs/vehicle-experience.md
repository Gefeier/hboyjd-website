# Interactive vehicle exteriors

Two display routes share the bilingual experience page. Three.js is pinned to
r182 / 0.182.0, MIT, and served locally under `assets/vendor/three-r182/`.

| Route | Display | Specification page |
| --- | --- | --- |
| `/vehicle-experience.html` | Existing procedural drop-side illustration | `/vehicles/EHJ9400LB.html` |
| `/vehicle-experience.html?model=JDV9382TDP` | Approved lowbed exterior GLB, V12 | `/vehicles/JDV9382TDP.html` |

Add `lang=en` for English, and optionally `paint=<id>` for a selected finish. For
example: `/vehicle-experience.html?model=JDV9382TDP&paint=jude-red&lang=en`.
The page is maintained separately from `scripts/build_english.py`.

## Display assets and scope

The original EHJ9400LB route builds a simplified straight drop-side exterior in
`vehicle-experience.js`: six sideboard sections, a tall front board and three
axles. It is not an exact CAD, scanned model or certified delivery configuration.
Its photo remains the same-series image at `assets/images/products/fence/01.webp`;
that photo shows a different deck variant and must not be described as this exact
model.

The JDV9382TDP route uses the approved, independently authored exterior at
`assets/models/jdv9382tdp-exterior-v12.glb`, through `lowbed-viewer.js`. It shows the
raised gooseneck, closed underside, cargo deck, three-axle wheel group and twin
loading ramps. Public photographs informed the exterior; it is not a production
CAD conversion, measured manufacturing model or exact certified configuration.
Its screen proportions are not product measurements. Options, dimensions and
delivery details remain subject to the actual vehicle and order.

The initial lowbed poster at `assets/images/3d/jdv9382tdp-red.webp` is rendered from
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
a 3D option. The uncompressed V12 is **7,217,396 bytes (about 7.2 MB), 242,466
triangles, 19 meshes and 14 materials**. The release preserves its approved
geometry and embedded textures; no lossy mesh compression or automatic model
download on first page view is required. No runtime request goes to a CDN.

- Drag / one finger orbits; wheel / pinch zooms. Buttons provide zoom and reset.
- Focused canvas supports arrow keys, plus/minus and Home.
- Lowbed focus points cover gooseneck, deck, axle group and loading ramps, with
  a separate gooseneck underside view. The original route retains its sideboard,
  deck, axle and landing-leg focus areas.
- Hotspot and paint controls are native keyboard-accessible buttons. Lowbed
  hotspot occlusion uses a few analytic boxes, not a raycast over every mesh.
- Language switches update text and links without rebuilding the model.
- Rendering occurs on interaction, resizing and short focus transitions. There
  is no auto-rotation; reduced motion skips transitions. Hidden views stop
  rendering, and canvas pixel ratio is capped at 1.5 for small surfaces and 2
  otherwise. Lowbed resizing retains the selected local view.
- Failed imports, fetches, parsing or WebGL context loss fall back to the photo.
- The lowbed loader accepts an AbortSignal. Model changes cancel the download;
  stale parsing results are disposed rather than attached. Caller generation
  checks remain necessary. Deliberate cancellation does not show failure UI.

The lowbed is already Y-up with nose toward -X. Only centering and grounding are
applied. Preserve the checked studio lighting, material values and thin-surface
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
configuration. An unlisted custom color requires a physical color confirmation;
the preview labels Jude Red as the temporary illustration. Links between the
full experience and configurator carry the model and recognized paint id.
The public specification page and actual order remain the source of product
parameters; the display model does not redefine them.

## Verification and release boundary

Syntax checks: `node --check` for `vehicle-experience.js`, `lowbed-viewer.js`,
`vehicle-3d-data.js` and `configurator-3d.js`. Browser acceptance must also cover:
desktop and 375 px layouts, all focus areas, paint selection, keyboard reset,
language changes (including during loading), photo/3D switching, reduced motion,
load failure, context loss and canceled/stale configurator loads. Confirm a fresh
page does not request the GLB until 3D is requested, and changing model during a
download does not leave a canvas or failure message for the old vehicle.

The release-copy GLB was independently re-read on 2026-09-29:

- SHA256: `5686d6e35a70053010db74aa31304941f7afbe024be557fbde26f3658db4d085`.
- Same bytes as the V12 asset with glTF Validator 0 errors / 0 warnings.
- Valid GLB header; 19 meshes, 14 materials, 242,466 triangles.
- No URI fields, extras, Windows/UNC paths or engineering file references.
- Four embedded brand PNGs contain only IHDR / IDAT / IEND chunks; no text or
  EXIF chunks. The only asset-level metadata is glTF version and Blender exporter
  version.

This records local asset and implementation checks, not a claim that browser
acceptance or production deployment has already completed. Deployment must
publish the approved public files only and read back the actual route, model
hash, dependencies and fallback behavior.
