# Hibbeler 12th edition — TrussVision mechanics coverage (18 October 2026)

**Status: broad foundational expansion, NOT a universal solver.** The 655-page uploaded *Engineering Mechanics: Statics* (12th ed., R. C. Hibbeler) was used to organize features by chapter. This repository DOES NOT include any pages, diagrams, problems, scans, or answer keys from that copyrighted book. Included examples are new, small independently coded test fixtures, with numerical values from user-provided problem statements where useful.

The three parts of the system are **image interpretation**, **structured mechanics model**, and **deterministic solve**. Verifying one does not verify the other two. A `CALCULATED` badge means an included mathematical model ran; it does not certify an AI-generated representation of a photographed diagram.

| Book chapter | Implemented and independently tested | Still unsupported or limited |
| --- | --- | --- |
| 1 — General Principles | Explicit units, force/mass conversion in spring example, equilibrium residual checks | Automatic dimensional analysis across arbitrary composed units |
| 2 — Force Vectors | Cartesian components; 2D/3D moments, cross products and force/resultant vectors | Full symbolic vector algebra and arbitrary direction-cosine extraction from photos |
| 3 — Equilibrium of a Particle | 2D and 3D particle tensions/reactions from known directions; reject negative cable tension | Slack-rope path reconfiguration, elastic cable stretch, variable contact geometry |
| 4 — Force System Resultants | 2D/3D force resultants, applied couples, moments about an arbitrary origin | General arbitrary distributed surface/volume load fields |
| 5 — Equilibrium of a Rigid Body | 2D bodies, connected bodies via ideal pins, fixed/pin/roller/directional restraints; 3D rigid bodies with known independent reaction DOFs; over/under-determination errors | General statically indeterminate systems, bearing geometry inference, geometric nonlinearity |
| 6 — Structural Analysis | Existing pin-jointed 2D trusses; new coupled ideal rigid bodies, spring loads and ideal rope segments | 3D truss solver, nonideal pulleys, flexible cables, all machines/frames, full FE frame forces |
| 7 — Internal Forces | Existing straight simply-supported beam reactions/shear/moment, UDL/linearly varying loads and couples; Vetin visualization | Arbitrary continuous beams, nonlinear members, frames/shaft distributed internal forces |
| 8 — Friction | Inclined-plane limiting static friction; sliding vs tipping; ideal impending-slip belt friction (capstan relation) | Wedges, journal/bearing friction, screw friction, brakes, actual kinetic motion, frictional contact complementarity |
| 9 — Center of Gravity/Centroid | Exact simple-polygon and composite cutout centroid; exact top/bottom polynomial-bounded areas | 3D volume centroid and general density distributions/curved surfaces |
| 10 — Moments of Inertia | Exact polygon Ix/Iy/Ixy and centroidal moments; exact polynomial-bounded area moments | Arbitrary polar/product *mass* inertia, 3D inertia tensors, all freeform curves |
| 11 — Virtual Work | One generalized unknown from explicitly supplied compatible virtual translations/rotations | Automatic mechanism kinematics and multi-degree-of-freedom virtual work |

## Added capabilities and scene schema

Add a `"physics"` object to the usual TrussVision scene using **Advanced Input → Apply Edited Scene**. For a complete template, choose the corresponding example in the existing Demo Scenario dropdown, click **LOAD DEMO**, and inspect/copy its `physics` object from **Advanced Input**.

Core operations (`physics.operation`):
- `spring`: `arrangement` (`series` or `parallel`), `stiffnesses`, `force` OR `massesKg`/`g` OR `extension`. Units of extension follow stiffness units (e.g. N/mm → mm).
- `rigid2d`: `bodies`, each with point `forces:[{at:[x,y], value:[fx,fy]}]`, `couples:[mz]`, supports `[{id,type,at}]` (pin, roller, fixed, or direction), optional `springs`, linearly varying vector `distributedLoads`; also `joints` between rigid bodies and `ropes` with force `segments` sharing one unknown tension.
- `particle`: `dimension:2|3`, `forces`, `tensions` with unit direction vectors, and optional `reactions` with known directions.
- `rigid3d`: `forces:[{at:[x,y,z],value:[fx,fy,fz]}]`, `couples:[[mx,my,mz]]`, `supports` (fixed, ball, directional) and optional anchored cable unknowns.
- `friction`: `model:'incline'|'belt'|'slide_tipping'`. Incline uses radians, belt wrap uses radians. Friction coefficients must be nonnegative.
- `centroid`: composite simple polygons via `regions:[{points:[[x,y],...]},{cutout:true,points:[...]}]`; self-crossing edges/holes outside solids are rejected.
- `centroid_polynomial`: top and bottom curves given as polynomial coefficient arrays (ascending powers) with `[xMin,xMax]`; integrates true curves exactly.
- `resultant`: known 2D or 3D force and couple sums. **Not a support reaction solver** unless actual supports are independently modeled.
- `virtual_work`: prescribed compatible displacement or rotation coefficients, one unknown generalized force or moment.

When `physics` is present, the **LOAD MULTIPLIER** is intentionally disabled: it cannot safely rescale every load type, spring displacement, friction threshold, and geometry with one knob. Edit and reapply the values in Advanced Input instead. Existing beam/truss load multiplier stays available.

## Physical assumptions and safeguards

- **Statics equilibrium** means ALL external forces and moments—including reactions—balance. Applied loads alone generally do not sum to zero.
- A negative solved **rope or cable tension is physically invalid** for a taut ideal rope. The engine rejects it.
- A linear system that lacks unique reaction/tension values fails rather than fabricating answers. Separately, one may obtain load-specific balance without complete stability; those models receive a stability warning.
- All beam, shape, spring, pulley, body and contact models still rely on **correct extracted and reviewed geometry**. User-written handwritten answers are NOT canonical ground truth.
- The scanner is given richer extraction instructions and retains a bounded structured `physics` field, but no live network AI scan was validated in this package. The AI might omit needed parameters or classify a problem incorrectly. Use the provided JSON fixtures as the numerical truth source; compare independent derivations.
- Loads on ropes of different pulley systems do not automatically share tension. Segments within the **same ideal rope** share tension only for frictionless, massless rope/pulley idealizations.
- The polygon method uses geometry from the `physics.regions` coordinates, not the preview canvas points. Never pass a curved region as a coarse polygon if an exact result is required; use polynomial integration when applicable.

## Book-related regression examples

- CE 211 spring-supported masses: 0.717 kg + 0.336 kg with `k = 27.1 N/mm` → `δ = 0.38117 mm` (approximately).
- CE 211 belt friction: `T_high = 44 lb`, `μ = 0.43`, total wrap `2π rad` → `T_low ≈ 2.95 lb` (impending slip).
- CE 211 curved region `y_top=x²/15`, `y_bottom=-x/2`, from `x=0` to `15 ft`: `Iy = 16453.125 ft⁴`. The engine integrates the actual polynomials, not a polygon trace.
- CE 211 bent pipe: `r=(-20,39,59) ft`, `F=(8,17,-21) lb`, applied couple `(0,0,-183) ft·lb`: moment resultant `(-1822,52,-835) ft·lb`. If a handwritten sketch substitutes `z=34 ft`, that is a separate, inconsistent input choice.

## Not a proof of “anything in this book”

Passing deterministic fixtures multiple times establishes **repeatability for those fixtures**, not correctness for arbitrary photographed diagrams or advanced mechanisms. Before advertising comprehensive textbook coverage, add a multi-hundred-problem set of independently validated, non-copyright-infringing test cases, with image-extraction benchmark annotations and measured real scan accuracy by chapter.
