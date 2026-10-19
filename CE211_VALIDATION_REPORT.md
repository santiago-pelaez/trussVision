# CE 211 document-based validation — 2026-10-18

## Scope and reproducibility
Nine PDF uploads were examined, representing **seven distinct documents** (duplicates of Exam 2 and Exam 3). The scanned pages include multiple independent questions and handwritten calculations. They are private reference material: **none of the supplied PDFs or screenshots are bundled in this deliverable**.

Six consecutive local test runs completed with zero observed failures. Full output: `CE211_SIX_RUN_LOG.txt`. Each pass included 210 Vetin tests; 17 contract checks; the original truss suite; eight beam/3D checks; 25 numeric assertions derived from selected CE211 questions; and an asset/deployment reference check. Repeating the same deterministic tests establishes reproducibility, **not broad coverage of every scanned question**.

## Coverage, paper by paper

| Uploaded document | Relevant content | What we actually tested | Status |
|---|---|---|---|
| Exam 1 - 136, p. 2 | Two-block linear spring equilibrium | 0.381178 mm extension using total mass 1.053 kg, 27.1 N/mm | Reference primitive passes; **not wired to scan/UI** |
| Exam 1 - 136, p. 2 | Vector from point A on y-axis to B | Vector (-7.5,-2,5.9) / sqrt(95.06) | Reference primitive passes; **not wired to scan/UI** |
| Exam 1 - 136, pp. 3–5 | 3D force directions, multi-force particle equilibrium, cable system | No paper-specific end-to-end tests | **Not verified** |
| Exam 2 - 220, p. 3 | Bent-pipe moment about origin | Printed position (-20,39,59), force (8,17,-21), -183 z-couple -> (-1822,52,-835) ft-lb | Existing spatial solver AND independent reference calculation pass |
| Exam 2 - 220, pp. 2–5 | Steering-wheel torque, fixed cantilever, frames, bearings and 3D reactions | No paper-specific end-to-end tests | **Not verified** |
| Exam 3 - 115, p. 2 (B) | 2D truss zero-force CE, member BC | CE=0, BC=+2.4666667 lb tension with stated printed geometry and loads; verifies joint/equilibrium residuals | Current 2D truss solver passes on a **manually structured input** |
| Exam 3 - 115, pp. 2–5 | Additional truss, shear/moment, pulley and frame problems | No complete paper-specific tests beyond p.2(B) | **Not verified** |
| Exam 4 - 162, p. 2 | Friction: fridge, W=180 lb, horizontal P=44 lb | mu threshold P/W = 0.244444... | Reference ratio passes, but **tip-vs-slide condition requires geometry**; not integrated |
| Exam 4 - 162, p. 2 | Belt friction with mu=0.43, W1=44 lb | Generic high/low ratio exp(mu*theta), conditional on 2pi wrap | Formula primitive tested; exact direction/wrap from picture **not end-to-end verified** |
| Exam 4 - 162, pp. 3–5 | Centroids, distributed forces, compound sections, pulley/winch | No full end-to-end tests | **Not verified** |
| HW 22 | Beam point forces, applied couples, distributed loads; section equations and V/M diagrams | Existing generic beam test suite handles elements, but actual homework geometry and full piecewise diagrams not reproduced | **Not verified end-to-end** |
| HW 23, pp. 1–2 | 46-ft pinned-roller beam with 9.8 lb/ft on [8,38], opposite 414 ft-lb couples | RA=RB=147 lb; max abs shear 147 lb; max abs moment ~1864.5 ft-lb; force/moment closure | Existing TrussVision beam solver passes on manually structured input; max-M is sampled |
| HW 23, pp. 3–4 | Beam with overhang, triangular/uniform distributed loads and couple | No homework-specific structured test | **Not verified** |
| April 17 scan, p. 1 | Planar area second moments for region x∈[0,15], y_top=x²/15, y_bottom=-x/2 | Iy=16453.125 ft⁴; Ix≈2938.62 ft⁴ using numerical Simpson integration versus analytic integrals | Reference primitive passes; **not integrated into scanner/UI** |

## Major unresolved issue: vision extraction
No live API key or deployed Netlify environment was available for this run. None of the PDFs were submitted to the deployed image scanner six times. The tested objects were **human-transcribed structured cases**, not original image-to-model-to-answer transactions. Therefore **DO NOT claim that all attached CE211 exam problems can be solved or that live scan accuracy is validated**.

## Discrepant written answers
- Exam 3 p2(B): the handwritten **168.484 lb** conflicts with equilibrium of the depicted rightmost unloaded-joint sequence with printed values. For that topology BC=23-42*(2.2/4.5)=+2.4667 lb (tension). A human should inspect support/model geometry and confirm the target member before using this as a grading key.
- Exam 2 bent pipe: the handwritten working uses vertical coordinate 34 ft (59-25), whereas the printed point location is z=59 ft. Moment around origin must use the **absolute stated location** for the force, yielding (-1822,+52,-835) ft-lb under CW=-z convention. Alternative z=34 gives (-1397,-148,-835), a *different geometry*.
- The reference friction and belt problems require clearly confirmed impending-motion direction and total contact angle, not a memorized ratio blindly matched to a handwritten value.

## What was added
1. `trussvision/fundamentals-solvers.js`: pure, input-validated helpers for three-dimensional direction/cross/moments, spring extension, friction threshold, capstan formula, and numerical area second moments. **These functions are not called by the TrussVision user interface or the AI extraction pipeline.**
2. `tests/ce211-paper-benchmarks.js`: 25 independent numerical assertions covering representative uploaded questions. Covers a subset only.
3. `tests/run-six-passes.sh`: deterministic six-pass validation runner (bash/Git Bash/WSL).
4. GitHub Actions now runs paper benchmarks and checks helper syntax.
5. `CE211_SIX_RUN_LOG.txt`: saved test output.

## Next engineering work to satisfy the literal ALL requirement
- Build an item-by-item source-to-fixture catalog for every subquestion and independently resolve ambiguous scans; reject incorrect handwritten solutions.
- Implement separate solvers for 3D rigid-body support reactions, cables and pulleys, frame members, fixed and multi-span beams, friction/tipping geometry, compound centroids/inertia, and distributed 3D loads.
- Add a human-reviewable extracted-model view and image ground truth fixtures, then measure precision for supports, member connectivity, loads, sign directions and units.
- Perform six **actual full scan-to-answer runs for every question** with the deployed image-analysis API, report pass rate and confidence intervals; do not substitute re-running deterministic tests for this.
- Verify exact extrema using piecewise calculus where necessary; the existing straight-beam UI currently samples moment extrema.

**Public deployment advice:** label unsupported problem classes as "visualization only / not solved". Never display a fabricated answer to make a screenshot look complete. Do not publish the copyrighted exam PDFs without authorization.
