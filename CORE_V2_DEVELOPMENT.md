> Historical development checkpoint. For current status and testing, see [STUDIO_RELEASE_NOTES.md](STUDIO_RELEASE_NOTES.md) and [README.md](README.md).

# TrussVision Independent Mechanics Core — development build

**Status:** Development workbench only. **Not a public release, not a universal Hibbeler solver.**

The goal is to isolate the original Vetin beam system from the general engineering-mechanics computations and to keep AI image interpretation separate from the numerical engine. Vetin remains in `vetin/` as a specialized beam-analysis tool under its MIT license and retained attribution. The old TrussVision interface is preserved at `trussvision/index.html` for comparison and legacy features. The experimental new interface lives at `trussvision/workbench.html`.

## Open locally

In the extracted `trussVision-main` folder, run:

```bash
python3 -m http.server 8765
```

Then open **http://localhost:8765/trussvision/workbench.html**. The 15 synthetic mechanics demonstrations do not use Gemini credits. The old workbench remains at `/trussvision/`; the original Vetin app remains at `/vetin/`.

You can import a single prior Gemini JSON report. This scans nothing and uses zero API requests. A successful extraction must still be **reviewed** before calculation. In the new workbench, only one image is accepted per scan. Use `https://aistudio.google.com/apikey` for a personal Gemini API key, which is provided only at scan time. Do not share, store, or commit the key.

## Architecture

- `trussvision/core/engine.js`: new independent deterministic physics and units engine. No dependency on Vetin, the legacy TrussVision solver, npm, network, or AI.
- `trussvision/core/adapter.js`: validation and routing from reviewed Gemini scene to typed mechanics model. Derived screen coordinates aren't accepted as a substitute for physical dimensions.
- `trussvision/core/examples.js`: 15 fully specified synthetic exercises for regression and interactive demonstration.
- `trussvision/workbench.js`, `workbench.html`, `workbench.css`: single-problem review, editable canonical JSON, numerical output, basic projection, and signaled failures.
- `vetin/`: unmodified specialized beam functionality from the previous repository snapshot.

The mathematical core accepts quantities with both `value` and `unit`, converts to SI internally, and reports SI values. Disallowed or unknown units are rejected rather than silently assumed. Position, force and moment are separate physical dimensions. The result model explicitly distinguishes generated force resultants from unknown support reactions.

## Implemented core operations

| Operation | Requirements / limits |
| --- | --- |
| `unit_vector`, `angle_between` | 3D vectors; signed orientation vs unoriented angle explicit |
| `moment_magnitude` | Explicit force magnitude, radius and included angle |
| `force_resultant` | Concurrent force vectors without fictional length scale |
| `resultant` | Known 2D/3D applied forces and free couples; not support reactions |
| `rigid2d` | Single rigid body; pin, fixed, directional smooth-contact supports |
| `rigid3d` | Rigid body; fixed, ball, journal and thrust bearing, directional constraints; eccentric load locations |
| `frame2d` | Multiple rigid bodies with explicit internal hinges and two-force members; linear statically determinate systems |
| `particle` | Known 2D/3D forces, direction-verified cables; tension-only constraints |
| `truss2d` | Planar pin-jointed **statically determinate** trusses; joint loads only; method of joints |
| `spring` | Linear Hooke-law springs in series or parallel; explicit stiffness units and forces/masses |
| `belt_friction`, `slide_tip` | Capstan friction and simplified impending sliding/tipping, respectively |
| `geometry2d` | Exact polygons, rectangles, semicircles, quarter circles, cutouts, Ix/Iy/Ixy and simple density×thickness weighted CG |

Not yet in the new independent core: spatial (3D) truss stiffness/forces, arbitrary continuously indeterminate frameworks, general screw/wedge/rolling friction, arbitrary cable shape, general virtual work for mechanisms, arbitrary composite curved boundaries, parametric shear/moment equations, deformation, contact stress, textbook-wide automatic problem decomposition, and automatic multibody model construction for every diagram. Vetin provides beam internal force/deflection analysis under its own documented limits.

The diagram is an **input projection** (not a structural deformation or finite-element plot). It should not be interpreted as evidence that the AI read an image correctly.

## Test matrix

**Local offline checks:**

```bash
node tests/core-v2-tests.js
node tests/run-tests.js
node tests/trussvision-checks.js
node tests/gemini-contract.js
node tests/demo-audit.js
node tests/hibbeler-regression.js
```

The new core has **44 checks** across algebra, constraints, failure modes, units, trusses, bearings, 2D frames, mass centroids and friction. **15 new interactive examples** passed a headless Chromium interaction test, including JSON imports and rejecting an incomplete scanned problem. **10 private scan reports** from CE 211 Exam 1 and Exam 2 were independently checked with an offline script; the original course material, personal identifiers, and raw exam JSON were kept **outside this package** and should never be uploaded to the public repository.

These tests do **not** prove general photo-to-solution accuracy. The tests are validation evidence for the current program paths only, and no real-image Gemini call or all-chapter accuracy audit was made as part of this rebuild.

## Next development/release gates

1. Freeze a typed extraction contract that records source provenance, quantity units, exact support constraints and uncertainty instead of relying on Gemini to choose solver operation.
2. Replace the rough input projection with a user-editable free-body diagram. Provide correction of forces, dimensions, hinge connectivity, supports, gear contact offsets, and sign conventions before solving.
3. Implement and independently benchmark remaining major Hibbeler statics families, especially 3D trusses, contact/friction mechanisms, arbitrary cable/pulley systems, internal-force functions, and more complex geometry/integration.
4. Run complete real-image-to-review-to-calculation tests with a representative set of *permission-safe* independent reference problems. Record per-topic accuracy and reject unsupported/misinterpreted classes visibly.
5. Add structural graphical browser tests, accessibility checks, mobile verification, security checks and deployment tests; confirm every public demo shows the correct numerical answer.
6. Only after release gates pass, replace/merge the legacy workbench, review claims in the public README, and intentionally deploy after collaborator review.

This folder is a **development checkpoint**, not a copy of a fully verified production app. The project should not be advertised as “solve the entire Hibbeler textbook” at this point.
