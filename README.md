# TrussVision — Statics Studio

**Engineering mechanics workbench with a connected, physical-unit drawing editor and independently computed equilibrium solutions.**

Built by Azhan Mohammed and Santiago Pelaez for WSU CrimsonCode / Hacktoberfest 2026, with a specialized beam-analysis component based on [Vetin Beam](https://github.com/rasimtemur/vetin-beam) by Rasim Temür (MIT license). Original copyright and MIT license notices are retained in `LICENSE` and `vetin/`.

## Use it

- **GitHub Pages:** `https://santiago-pelaez.github.io/trussVision/trussvision/` (the root and `/trussvision/` redirect to the new studio after this branch is merged)
- **Legacy viewer:** `/trussvision/legacy.html`, preserved for backwards comparison.
- **Original Vetin beam analyzer:** `/vetin/`. Use this for beam shear/moment diagrams and elastic curves, not as a universal statics solver.

To run locally:

```sh
python3 -m http.server 8765
```

Navigate to `http://localhost:8765/trussvision/`.

No framework, API server, installer or Google key is needed to draw, work through the examples, or solve a manually constructed problem. Scan mode requires a **user-supplied** Google AI Studio key from https://aistudio.google.com/apikey. The key is not saved by TrussVision and is passed directly to Google's API using the `x-goog-api-key` header. **Never add keys to Git commits or screenshots.** Google calls count against the user's quota. This static-site key model is appropriate for personal experimentation, not for a shared organization's centrally managed or publicly embedded API key.

## Interactive diagram

1. Choose **Pin-jointed truss**, **Rigid body**, **Vertical spring system**, or **Ideal pulley** and click **New blank model**.
2. Choose the **Joint** tool and click to place nodes on the physical-unit grid. Each node has a persistent ID and snapped coordinates.
3. Add **members or springs** by clicking two existing joints. Add **forces, moments, supports, or pulleys** by clicking the target joint. Elements stay attached when you drag the joint.
4. Edit joint positions and applied values in the selected-element inspector. Use the **Length** and **Force** controls to convert units, preserving physical quantities and moment consistency. The grid's snap interval is specified in the visible length unit.
5. Review your assumptions, check the confirmation checkbox, and click **Solve reviewed model**.
6. The diagram distinguishes applied forces and support reactions; for a solvable truss it labels member tension/compression and the calculated force. Numerical derivations and independent equilibrium residuals appear beside the drawing. Failed equations clear stale results.
7. Use the **Advanced JSON** panel for numeric models without a 2D edit surface, including 3D equilibrium, composite areas, friction, bearings, and multibody frames. Download the current JSON as a reusable example.

**Spring workflow:** The guided spring mode supports one vertical hanging force connected to a single unbranched series chain of spring elements, with a fixed top anchor assumed. It does not solve arbitrary branched spring networks, dynamic release, or distributed mass. **Pulley workflow:** The guided ideal pulley computes equal tension in a user-specified count of supporting rope segments. It does not infer the number of segments from the drawing, pulley inertia, slipping, or arbitrary frictional rope configurations.

## Gemini image scans and review

Input: **one problem at a time**, PNG/JPEG/WEBP up to 9 MB. The extraction prompt asks for:

- Every printed measurement and its original explicit unit (including stiffness, couples, distributed loads, mass, area, and angles), source of the value, and an uncertainty indicator;
- Separate typed unit-audit fields and a list of unresolved units;
- Support restraints, known forces, dimensions and directions without fabricated reactions;
- A structured physics model only if the diagram contains enough trustworthy information.

The UI lists reported source quantities for review. **The scan is a draft, not a verified engineering answer**: user review is required, ambiguous units are rejected by the adapter, and the deterministic solver—not Gemini—computes the results. Only one model request is made per scan; there are no hidden multiple-model retries that can exhaust API quota. Previously saved diagnostic JSON files can be imported without another Gemini call. If a scan is incomplete, the previous answer is cleared rather than shown alongside the error.

## Supported numerical solver families

| Solver | Practical scope |
| --- | --- |
| 2D and 3D force resultants | Concurrent force addition; known eccentric moments where coordinates are given |
| 3D vectors | Unit vectors, angles and directed moments |
| Rigid 2D body | Pin/fixed/directional/vertical roller supports, point loads and couples |
| Rigid 3D body | Ball, journal, thrust bearing and specified directional restraints, eccentric loads |
| Pin-jointed trusses | Statically determinate planar (editor) and spatial (advanced JSON) systems |
| Multibody planar frames | Explicit rigid bodies and internal hinge connections |
| Cable joints | Particle equilibrium and tension-only cable constraints |
| Springs | Ideal linear series/parallel Hooke-law combinations, explicit stiffness units |
| Ideal pulley | Ideal mechanical advantage for explicitly entered supporting-rope count |
| Friction | Capstan/belt model and a simplified rigid-block slide-versus-tip threshold |
| Composite sections | Exact area/centroid/inertia for supported rectangles, polygons, semicircles and quarter circles; mass density/thickness weighting |
| Vetin beam analysis | Specialized beam support reactions, shear, bending-moment and elastic-curve methods, with Vetin's original limits |

There are **17 self-contained numerical examples**. Every model that the solver accepts still requires physical assumptions to match the real diagram. Zero equilibrium residual verifies the equations for *that model*, not correct image recognition.

## Limitations / accuracy standard

This is **not an arbitrary Hibbeler textbook solver** or a certified structural design package. A single image can omit an essential contact direction, hidden hinge, external load, or unit. Unsupported classes include arbitrary spring/pulley/gear network topology, mechanisms requiring virtual work, fully indeterminate trusses without stiffness methods, general contact/friction networks, large deflections, nontrivial material nonlinearities, and automatic parsing of every multibody figure. The app must request corrections instead of manufacturing a result. Independent professional verification is required for real-world structural and nuclear engineering decisions.

Numerical regression passing does **not** establish real-image OCR success rates. A fresh authenticated real-image end-to-end matrix across all supported problem families remains a release acceptance requirement before advertising all-scan accuracy.

## Development checks

```sh
node tests/core-v2-tests.js
node tests/studio-editor-tests.js
node tests/run-tests.js
node tests/trussvision-checks.js
node tests/gemini-contract.js
node tests/hibbeler-regression.js
node tools/check-deploy.js
```

Browser interaction tests use Playwright + Chromium. Install Python Playwright and a Chromium browser, then run `python3 tests/studio-browser.py`. The browser test injects the project's real static HTML/CSS/JS into Chromium, exercises all 17 examples, node/member/support/force/spring/pulley editing, physical unit conversion, and safe failure of an incomplete JSON import, **without any billable Gemini API call**.

Do not publish photographed CE 211 exam materials or associated identifiable private benchmark files; exams were privately used to discover and reproduce parser/solver weaknesses but are intentionally excluded from the repository.

## Project paths

- `trussvision/workbench.html`: public studio UI
- `trussvision/workbench.js`: editable SVG surface and numerical output, no framework
- `trussvision/core/editor.js`: connected graph and unit-aware editing
- `trussvision/core/engine.js`: independently verified deterministic SI mechanics
- `trussvision/core/adapter.js`: strict draft-extraction → typed numerical model converter
- `trussvision/gemini-client.js`: private user API call, source-value and unit extraction prompt
- `trussvision/legacy.html`: original TrussVision UI for compatibility
- `vetin/`: separately licensed beam analyzer, left in place
- `tests/`: core, legacy and interactive regression suites

## Attribution and licenses

TrussVision builds on the open-source Vetin Beam project by Assoc. Prof. Rasim Temür, Istanbul University-Cerrahpaşa. See `LICENSE` and the attribution and original license notices inside `vetin/`.
