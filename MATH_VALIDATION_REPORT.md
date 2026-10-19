# TrussVision mathematical validation (2026-10-18)

## Changes in this revision
- Added `trussvision/statics-solvers.js`, pure functions for a **single straight two-support beam** and for the **resultant of specified 3D applied forces/couples**.
- Beam solver now includes vertical and horizontal point loads, linear (including uniform/triangular) distributed loads, applied concentrated CCW-positive couples, correct support reactions, and shear/bending-moment discontinuities evaluated from both sides.
- The 3D spatial vector solver now rejects loads referencing nonexistent nodes instead of silently skipping them. 3D sums are **applied resultants**, not a 3D frame/shaft equilibrium solver.
- The beam reaction telemetry can display a nonzero horizontal reaction at the pin.
- The AI extractor retains beam point-load horizontal components and coordinate-based couples; scanned values must still be confirmed by a person.
- A new regression suite is run by GitHub Actions.

## Verified benchmarks
- 4 m simple beam with a downward 10 force-unit midpoint load: RA=RB=5, max |V|=5, max |M|=10 force·length units.
- 4 m beam with uniform 6 downward force/length: RA=RB=12, max |M|=12.
- 4 m beam with triangular load linearly increasing from zero to 6 downward: RA=4, RB=8.
- 4 m beam with CCW +8 couple at the midpoint: RA=+2, RB=-2; moment diagram has a -8 jump at the applied couple.
- 4 m beam with horizontal +14 and vertical -10 point load: horizontal pin reaction -14, RA=RB=5.
- 3D point at (-20,39,59) ft with force (8,17,-21) lb and external z couple -183 ft-lb: applied moment (-1822,52,-835) ft-lb. If z is 34 instead, result (-1397,-148,-835). The printed force application point in the prior scanned homework is z=59: do not substitute 34 absent a change to the reference point.
- Original truss test suite: photographed exam topology and stable teaching triangle; singular mechanisms correctly rejected.
- Vetin regression tests and model conversion/deployment contract tests retained.

## Mathematical/feature limitations: DO NOT claim universal correctness
1. Image-based geometry is inferred by a vision model. If it places a support, member, dimension, force direction, or applied couple incorrectly, the numerical solver can faithfully solve the **wrong model**. A warning/high confidence percentage is not a proof of correctness.
2. The truss engine is a **linear-elastic, small-deformation, 2D pin-jointed axial-bar solver**. It cannot solve frames, bent beams, trusses with intermediate member loads, spatial trusses, or arbitrary partial-restraint supports. Its displayed utilization depends on user-entered area/modulus/yield assumptions, not material data from the photograph.
3. The new beam solver covers only a straight, horizontal, 2-support statically determinate single span with at least one horizontal pin restraint; not fixed cantilevers, continuous beams, frames, angled beams, or material deflections. All loads and applied moments must be entered with the intended sign convention.
4. The 3D routine calculates resultant applied vectors and r-cross-F plus applied couple. It does **not** solve 3D reactions, force distribution between bearings, cable tensions, or compatibility.
5. The UI's highlighted max moment is a **sampled** value; true extrema may occur between sampled points. We sample 321 locations plus discontinuity points, but this is not a guaranteed analytic optimizer.
6. Missing or illegible dimensions and support directions must trigger review rather than fabricated numerical answers. The interface should never display a reaction as zero unless actually calculated to zero.
7. The photographed truss test uses a narrowly matched repair of a wall-pin support at G; this is a heuristic applicable only to that exact known scene. Do not generalize that correction to other trusses.
8. The AI client is deployed via Netlify and requires its original server-side credentials and supported model configuration; live extraction has **not** been validated in this offline audit.

## How to test
```sh
node tests/statics-regression.js
node tests/truss-regression.js
node tests/trussvision-checks.js
node tests/run-tests.js
node tools/check-deploy.js
```

## Important next steps before publishing as an engineering solver
- End-to-end browser tests on scanned reference images, including extracted nodes and forces. Inspect the extracted JSON, not merely the resulting numeric labels.
- Add independent finite-element and hand-calculation cross-checks for many truss geometries, and material/stability diagnostics.
- Add an explicit calculation provenance and model-review acknowledgement for AI-extracted scenes.
- Update the app's educational text to describe only the actual solved problem families, with units and conventions prominently shown.
