# TrussVision

**AI-assisted statics diagram review and deterministic mechanics practice.**

Built by **Azhan Mohammed and Santiago Pelaez** for **CrimsonCode: Hacktoberfest 2026**, hosted by **ACM at Washington State University**. The team placed **5th** (team-reported). The event follows Major League Hacking's Code of Conduct; it is not accurate to describe MLH as the sole event organizer.

**Live demo (team repository):** https://santiago-pelaez.github.io/trussVision/trussvision/  
**Source (team repository):** https://github.com/santiago-pelaez/trussVision  
**Get a Google AI Studio API key:** https://aistudio.google.com/apikey

## What it does

1. Open a built-in mechanics example **without an API key**, or upload a cropped JPG/PNG/WebP diagram or small PDF.
2. Optionally use Google's **Gemini API** to suggest the geometry, loads, supports, units, and problem type.
3. **Review and correct** the extracted scene and any optional structured mechanics parameters in Advanced Input.
4. Inspect the educational visualization and deterministic results for the supported problem class.
5. For a supported **straight, horizontal, dimensioned 2D beam**, optionally hand off the reviewed scene to the preserved Vetin beam solver.
6. Export the current scene as JSON.

Supported deterministic demonstrations include 2D trusses, simple beams, 2D/3D resultants, particle cables, ideal pulley ropes, Hooke-law springs, supported rigid bodies, dry/belt friction, composite polygon centroids, simple polynomial-bounded areas, and limited virtual work. **Support is conditional on valid structured input**, not merely recognizing an image. See [exact solver capabilities and assumptions](HIBBELER_COVERAGE_AND_LIMITS.md).

This is an **educational prototype**, not a structural-design or safety-certification tool. AI extraction can misread diagrams or invent missing inputs; a confident-looking answer is not proof of correctness. Confirm *all* units, force directions, geometry and boundary conditions yourself.

## Start locally

No npm dependencies, build tools, or paid account required for the deterministic demos. Run a local HTTP server in the extracted **project root** (the folder containing `index.html`):

```bash
python3 -m http.server 8765
```

On Windows, `py -3 -m http.server 8765` also works. Then open **http://localhost:8765/trussvision/**. Select a demo and click **LOAD DEMO**.

### To scan your own problem

1. Create an API key in [Google AI Studio](https://aistudio.google.com/apikey). This is a **Gemini API key**, which may also authenticate compatible hosted Gemma models; TrussVision itself currently calls **Gemini image-understanding models**, not Gemma.
2. Open **AI SETTINGS**, paste **your own** key, and choose an available model.
3. Select your cropped image/PDF and click **SCAN**.
4. Read warnings, verify the extracted numbers and units, and fix errors in the Advanced Input editor before drawing conclusions.

On **GitHub Pages** and other static hosts, the browser submits your key **directly to Google's API in a request header**, not to this GitHub repository. The key is not stored in source control or browser local storage, but it is still exposed to your own browser and its extensions. **Never share or commit API keys, screenshots containing keys, or `.env` files.** Apply quota limits and API restrictions as appropriate. For public production deployments, a trusted backend with rate controls is safer than a browser-supplied credential.

On **Netlify**, you can configure the optional `netlify/functions/analyze.cjs` handler with a *server-side* `GEMINI_API_KEY`. The front end prefers the same-origin `/api/analyze` endpoint when available. A publicly exposed unprotected server endpoint may consume your quota; consider authentication, abuse protection, and rate limiting before deploying a shared server key.

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Redirects to the TrussVision workbench |
| `/trussvision/` | Main statics workbench, demonstrations, JSON review, Gemini adapter |
| `/vetin/` | Original Vetin beam-analysis application, with an explicit handoff bridge |
| `/netlify/functions/analyze.cjs` | Optional server-side Gemini integration (Netlify only) |
| `/tests/` | Regression tests, physical benchmarks and integration contracts |

The app is framework-free and works on static hosts. GitHub Pages **does not run Netlify functions**; on Pages, scans require a personal API key in AI Settings.

## Run checks

From the repository root with Node.js installed:

```bash
node tests/run-tests.js
node tests/trussvision-checks.js
node tests/truss-regression.js
node tests/statics-regression.js
node tests/ce211-paper-benchmarks.js
node tests/hibbeler-regression.js
node tools/check-deploy.js
```

The included GitHub Actions workflow runs these checks on each push or pull request. Automated numerical checks validate known examples and explicit failure cases, **not** every real-world statics drawing or AI scan. The Gemini integration cannot be tested without an API key and network access.

## Publish to GitHub Pages

See **[PUBLISHING_GUIDE.md](PUBLISHING_GUIDE.md)** for step-by-step publishing instructions, including the existing team repository, collaborator permissions, a separate personal fork/repository, and how to check the live site.

The Pages deployment uses **Settings → Pages → Deploy from a branch → main → /(root)**. There is no build command. Keep `index.html`, `trussvision/`, `vetin/`, and `netlify/` in the same repository root. After changes, wait for the Pages deployment to finish and check the console and the live site.

## Architecture and limits

- `trussvision/app.js`: UI state, interactive canvas, scan workflow, solver presentation.
- `trussvision/truss-solver.js` / `statics-solvers.js` / `mechanics-engine.js`: deterministic math paths.
- `trussvision/gemini-client.js`: direct Google API adapter for static hosts, with bounded scene extraction.
- `trussvision/vetin-export.js`: unit-checked bridge to the preserved Vetin model.
- `vetin/`: original beam simulation and its bundled libraries/assets.
- `tests/`: independent regression checks; see the included mathematical validation reports.

AI review and math solving are separate. Do not expect every classified `beam`, `frame`, `3D`, `friction` or `spring` image to solve without manually supplying appropriate structured data. The bridge supports a smaller set than the full preview engine. Review [coverage and known unsupported cases](HIBBELER_COVERAGE_AND_LIMITS.md) before trusting outputs.

## Credits and license

TrussVision: **Azhan Mohammed and Santiago Pelaez**. Built for the [WSU ACM CrimsonCode: Hacktoberfest 2026 event](https://wsu-acm.github.io/crimsoncode/).

The project **builds on and includes** the MIT-licensed [Vetin Beam Analysis](https://github.com/rasimtemur/vetin-beam) software by Assoc. Prof. Dr. **Rasim Temür**, Istanbul University-Cerrahpasa. Original Vetin source, third-party dependencies, and attribution are retained. See the repository [MIT License](LICENSE).
