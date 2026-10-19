# TrussVision Statics Studio — opt-in mechanics editor

This release introduces an editable 2D physical-unit mechanics grid, independent numerical solvers and Gemini quantity/unit provenance. It is intended for educational use and requires review of scans, not certified structural design.

## Interface preservation

The original TrussVision three-column interface remains the default at `/trussvision/`. The more extensive drawing workspace is available only by navigating to `/trussvision/workbench.html`. This was changed after feedback that the visual redesign had not been requested.

## Local regression evidence

- Numerical examples: **17/17** independently generated models solve in the new core, and each also completes through the browser button.
- Core regression: 44 independent v2 checks, 9 connected-editor regression checks, and the historical Vetin / TrussVision suites pass.
- Browser paths: editing and solving a planar truss with joint snapping; attached pin, roller, applied forces and members; converting m↔ft without changing physics; series spring and ideal pulley solve; clearing stale results when a malformed scan is loaded.
- The prompt requests source quantities with **original unit strings** plus `unitAudit.missing`; the client shows those fields, and the adapter refuses unresolved unit values.
- Every new scan uses one Google request with no transparent credit-consuming retry.
- The package retains the original Vetin analyzer at `/vetin/` and retains the MIT notices.

## Things this does not establish

- A real authenticated Google Gemini OCR run has not been completed for this release candidate. Prior manually supplied benchmark responses from CE211 Exams 1–2 were used to identify weaknesses, but they are not shipped. The new prompt's real-world extraction accuracy is unmeasured.
- The 2D diagram is **not** a finite element analysis, stress distribution or a general mechanical topology solver; cables and guided pulleys require explicit idealizing assumptions.
- 3D systems, multibody frames, centroids and friction are available through typed JSON and independent solvers, but not every 3D connection can be edited graphically yet.
- General indeterminate frameworks, sophisticated screw/wedge/contact systems, virtual work and all questions in Hibbeler are **not implemented**. The app will say why instead of inventing an answer.

## Repository publishing

Upload on a development branch, run CI and have a collaborator review before merging to `main`. The live GitHub Pages URL will remain the same after merge and deploy. Never commit personal Google API keys, private exam PDFs or student notes.
