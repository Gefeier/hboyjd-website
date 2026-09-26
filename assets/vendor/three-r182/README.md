# Three.js r182 (0.182.0)

Vendored for the on-demand vehicle exterior viewer. MIT license: see `LICENSE`.

Official source, pinned to release `r182`:

- https://github.com/mrdoob/three.js/tree/r182
- `build/three.module.min.js`
- `build/three.core.min.js`
- `examples/jsm/controls/OrbitControls.js`
- `LICENSE`

Files are unmodified. An import map resolves `three` to the local module build.
No visitor request to a third-party CDN is required. The modules are imported
only when the visitor activates the 3D view or a 3D control.

API references: https://threejs.org/docs/ and
https://threejs.org/docs/pages/OrbitControls.html
