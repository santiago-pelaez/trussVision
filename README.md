# TrussVision
Try it out here:
https://santiago-pelaez.github.io/trussVision/trussvision/
## AI-assisted structural statics for the Trick or Treat Hackathon

TrussVision turns a statics diagram into an editable structural scene. Upload a
clear image, review the detected geometry and loads, run the deterministic
structural preview, and send a verified compatible beam to the original Vetin
beam solver.

This repository is a TrussVision project built on top of the MIT-licensed Vetin
Beam Analysis application. TrussVision is the public application at the site
root, with the direct `/trussvision/` route kept available for static hosts.
The preserved Vetin solver lives under `/vetin/` and is opened only by an
explicit reviewed-beam handoff.

## What the project does

1. Upload a statics diagram or load one of the built-in demonstrations.
2. Ask Gemini to identify the problem type, dimensions, supports, loads, and
   other visible values.
3. Inspect and edit the proposed scene before solving it.
4. Use TrussVision's deterministic preview for the supported scene types.
5. Transfer a reviewed, dimensioned, straight 2D beam into Vetin with one
   click.
6. Use Vetin's original solver and diagrams for the final beam calculation.

For supported trusses and beams, the review panel explains the free-body
diagram, includes support reactions in the equilibrium equations, and reports
the calculated force and moment residuals. Applied loads alone are not expected
to sum to zero; the complete external system includes the reactions.

The image parser is designed to recognize several classroom statics topics,
including:

- 2D beams and trusses
- 2D frames and force diagrams
- friction and lever problems
- pulley and rope systems
- centroid and composite-area diagrams
- 3D cables, vectors, shafts, gears, and bearings

Recognition and preview do not mean that every problem can be transferred to
Vetin. Only a reviewed, dimensioned, straight 2D beam is eligible for the Vetin
handoff. Trusses, mechanisms, cables, and 3D problems remain in TrussVision's
review and visualization workflow.

## Applications in this repository

| Path | Purpose |
| --- | --- |
| [`/`](index.html) | Public TrussVision entrypoint; redirects to the Halloween interface |
| [`/trussvision/`](trussvision/) | Halloween-themed TrussVision AI importer and structural review UI |
| [`/vetin/`](vetin/) | Preserved Vetin Beam Analysis simulator and deterministic beam solver |
| [`vetin/vetin-ai-bridge.js`](vetin/vetin-ai-bridge.js) | Receives a reviewed beam from TrussVision and links back to the public app |
| [`trussvision/vetin-export.js`](trussvision/vetin-export.js) | Converts reviewed TrussVision beam scenes to Vetin model v2 JSON |
| [`trussvision/gemini-client.js`](trussvision/gemini-client.js) | Direct Gemini fallback for local static servers and GitHub Pages |
| [`netlify/functions/analyze.cjs`](netlify/functions/analyze.cjs) | Optional server-side Gemini endpoint for Netlify deployments |
| [`tests/`](tests/) | Vetin regression and TrussVision contract tests |

## Quick start: local testing

The project is a static web application and does not require a build step.
Serve it over HTTP so that the service worker and browser modules work
correctly.

```powershell
cd D:\trussVision
py -3 -m http.server 8765
```

Open the public interface and, when needed, the preserved solver:

- TrussVision: <http://localhost:8765/>
- Direct TrussVision route: <http://localhost:8765/trussvision/>
- Vetin solver: <http://localhost:8765/vetin/>

For an AI scan in local static mode:

1. Enter a restricted Gemini API key in the TrussVision interface.
2. Upload one clear, cropped problem image at a time.
3. Select **SCAN**.
4. Review every detected dimension, force, support, and warning.
5. Transfer only a compatible reviewed beam to Vetin.

The key is held in browser memory for the session and is never part of this
repository. Do not paste an API key into source files, commit it, or share it
in screenshots.

The built-in Beam / Distributed Load demonstration does not require Gemini and
is the fastest way to test the TrussVision-to-Vetin bridge.

## Test commands

Run the full existing test suite from the repository root:

```powershell
node tests\run-tests.js
node tests\trussvision-checks.js
node tests\truss-regression.js
node tools\check-deploy.js
git diff --check
```

The test suite covers the beam solver, reactions, internal-force diagrams,
elastic curves, determinacy checks, practice problems, model-file conversion,
embedded example models, service-worker deployment integrity, and the
TrussVision/Vetin adapter. The TrussVision contract checks cover the guided
workflow, in-app dialogs, static-host scan fallback, server-key boundary, and
beam handoff rules.

## Development architecture

TrussVision is intentionally framework-free so the same files work on GitHub
Pages and through `py -3 -m http.server`. The public interface is kept in
`trussvision/`; its app module owns scene state, deterministic previews, and
canvas interaction. The Gemini adapter and Vetin converter are separate
boundaries so they can be tested without loading the full UI.

The original Vetin runtime remains isolated under `vetin/`. It is not part of
normal navigation and opens only after TrussVision converts a reviewed,
dimensioned horizontal beam into Vetin model v2 data. The optional Netlify
function accepts only the server-side `GEMINI_API_KEY`; local static servers
and GitHub Pages use the session-only browser fallback when necessary.

## Deployment

### GitHub Pages

GitHub Pages can host this repository without Netlify:

1. Open the repository's **Settings > Pages**.
2. Select **Deploy from a branch**.
3. Select the `main` branch and the repository root (`/`).
4. Open the generated project-site URL.

The public app and its direct route are then available at:

```text
https://YOUR-USERNAME.github.io/trussVision/
https://YOUR-USERNAME.github.io/trussVision/trussvision/
https://YOUR-USERNAME.github.io/trussVision/vetin/
```

The project root intentionally redirects to TrussVision. The Vetin route is a
secondary solver destination used after clicking **SEND BEAM TO VETIN SOLVER**;
it is not the public landing page.

GitHub Pages does not run the Netlify function. In that mode, TrussVision sends
the typed key directly to Google's Gemini API for the current browser session.
Use a restricted key with an appropriate quota, and do not embed it in the
repository.

### Netlify (optional)

Netlify can run the Gemini request server-side and keep the production key out
of the browser:

- Publish directory: `.`
- Functions directory: `netlify/functions`
- Build command: leave blank
- Environment variable: `GEMINI_API_KEY`

When the function is available, TrussVision uses `/api/analyze`. The function
reads only `GEMINI_API_KEY` from Netlify environment variables. If the
function is unavailable or not configured, the application falls back to the
direct browser adapter for local or static hosting.

## Important limitations

- Gemini image parsing is probabilistic. It can misread symbols, dimensions,
  units, arrows, or handwritten annotations.
- Always verify the extracted scene before solving or transferring it.
- Only straight, dimensioned 2D beams are converted to Vetin model v2.
- TrussVision is an educational demonstration, not a code-compliance or
  professional engineering design tool.
- The preview solver intentionally supports a limited classroom statics scope;
  it does not claim to be a universal cable, rigid-body, buckling, shear-
  deflection, or structural-code solver.
- A successful AI response does not by itself prove that the result is
  physically correct.

## Repository structure

```text
trussVision/
|-- index.html                 TrussVision public redirect
|-- sw.js                      One-time cleanup worker for old root deployments
|-- vetin/                     Preserved Vetin solver runtime
|   |-- index.html             Secondary Vetin beam solver
|   |-- model.js, actions.js   Vetin model format and application actions
|   |-- solver.js, calculations.js
|   |-- vetin-ai-bridge.js     Reviewed-beam handoff bridge
|   |-- models/                Original Vetin example models
|   `-- vendor/                Bundled Chart.js and Three.js dependencies
|-- trussvision/
|   |-- index.html              TrussVision interface
|   |-- app.js                  Scene UI, scan flow, and deterministic preview
|   |-- truss-solver.js         Pure 2D truss solver shared by UI and tests
|   |-- gemini-client.js        Static-host Gemini adapter
|   |-- vetin-export.js         Reviewed beam to Vetin model conversion
|   `-- style files             TrussVision visual system
|-- netlify/functions/          Optional Gemini server function
|-- tests/                      Vetin regression and TrussVision contract checks
|   `-- fixtures/               Deterministic statics regression scenes
|-- .github/workflows/          CI checks for pushes and pull requests
`-- LICENSE                     Original MIT license
```

## Credits and license

TrussVision is the hackathon extension and integration work in this
repository. It preserves and reuses the original Vetin Beam Analysis
application, model format, solver, examples, tests, and MIT license.

The original Vetin Beam Analysis project was developed by Assoc. Prof. Dr.
Rasim Temur at Istanbul University-Cerrahpasa as part of the Vetin initiative.
See the original project at
<https://github.com/rasimtemur/vetin-beam>.

The repository is distributed under the MIT License. See [`LICENSE`](LICENSE)
for the complete license text.

---

**TrussVision - real statics, reviewed inputs, and an honest bridge to Vetin.**
