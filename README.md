<img src="logo.svg" alt="Vetin Logo" height="60"/>

# Vetin | Beam Analysis

**A browser-based computational tool for the determination of internal forces and elastic deformation in beam structures.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)](https://web.dev/progressive-web-apps/)
[![Languages](https://img.shields.io/badge/Languages-30+-orange.svg)](#-multilingual-support)
[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-www.rasimtemur.com-389fb6.svg)](https://www.rasimtemur.com/vetin/beam/)

> Developed by **Assoc. Prof. Rasim Temür** · Istanbul University-Cerrahpaşa, Department of Civil Engineering  
> Part of the **Vetin** initiative for the digitisation of academic instruction tools.

---

## 🌐 Online Access

> **[https://www.rasimtemur.com/vetin/beam/](https://www.rasimtemur.com/vetin/beam/)**

The application is accessible directly through a web browser without requiring any software installation, user registration, or server-side processing. All computations are performed client-side.

---

## 📸 Screenshots

<p align="center">
  <b>Structural Model &amp; Toolbar</b><br>
  <img src="screenshots/screenshot-main.png" alt="Main Interface" width="800"/>
</p>

<br>

<p align="center">
  <b>Internal Force Diagrams</b><br>
  <img src="screenshots/screenshot-diagrams.png" alt="Diagrams Panel" width="800"/>
</p>

---

## 📋 Description

**Vetin Beam Analysis** is an open-source, web-based software developed for educational use in structural mechanics and civil engineering curricula. The application enables the interactive graphical definition of beam structural models, and produces instantaneous visual representations of internal force distributions and elastic deformation curves — entirely within the web browser environment.

The software is intended to support both undergraduate instruction and self-directed learning by providing immediate visual feedback on the structural response of beam systems under various loading and boundary conditions.

**Key properties of the application:**

- Operates entirely within the client browser; no server-side computation is required
- Functions fully offline as a **Progressive Web App (PWA)** — all assets, including third-party libraries, are bundled and cached locally
- User interface is localised in **more than 30 languages**
- No third-party geolocation calls; language selection relies solely on the browser locale and saved preference
- Source code is freely distributed under the **MIT License**

---

## ⚙️ Functional Capabilities

### Structural Model Definition

The user defines the structural model interactively on a calibrated grid canvas. All elements are positioned with snap-to-grid precision and may be repositioned or modified at any stage of model construction.

### Boundary Conditions

The following support conditions are available for model definition:

| Symbol | Boundary Condition | Mechanical Behaviour |
|--------|-------------------|----------------------|
| △ | **Pinned Support** | Restrains vertical and horizontal translation; permits rotation |
| ○△ | **Roller Support** | Restrains vertical translation; permits horizontal translation and rotation |
| ▐ | **Fixed Support (Cantilever)** | Restrains all translational and rotational degrees of freedom |
| ◉ | **Internal Hinge** | Introduces a moment release at the specified location |

### Applied Loading

The following load types may be applied to the structural model:

| Load Type | Description |
|-----------|-------------|
| **Concentrated (Point) Load** | A discrete force applied at a specified position and inclination angle |
| **Bending Moment** | A concentrated moment applied at a specified cross-section |
| **Uniformly Distributed Load** | A load of constant intensity applied over a defined span |
| **Trapezoidal (Linearly Varying) Load** | A load with linearly varying intensity between two specified magnitudes |
| **Torsional Moment** | A concentrated torsional moment applied at a specified cross-section |

### Computed Output

Upon definition of the structural model, the following diagrams are generated automatically:

- **FBD** — Free Body Diagram, including computed support reactions
- **AFD** — Axial Force Diagram
- **SFD** — Shear Force Diagram
- **BMD** — Bending Moment Diagram
- **TMD** — Torsional Moment Diagram
- **ECD** — Elastic Curve Diagram (two-dimensional deflection profile)
- **3D Elastic Curve** — Three-dimensional interactive visualisation of the deformed beam geometry, rendered via WebGL

### Material and Cross-Section Properties

The elastic curve computation requires the specification of:

- **Modulus of Elasticity (E)** — expressed in GPa
- **Second Moment of Area (I)** — expressed in cm⁴

### Data Management

- **Save / Open** — The structural model may be exported to and imported from a `.json` file, enabling session continuity. Files use format version 2: all positions are stored in metres from the beam start, independent of screen size or grid settings (material properties *E* and *I* are saved as well). Older pixel-based files (version 1) can still be opened.
- **Vector Graphics Export** — The structural model and the corresponding free body diagram (FBD) can be exported directly in scalable vector graphics (SVG) format for high-resolution publishing
- **Diagram Export** — Computed internal force and deformation diagrams may be downloaded as PNG image files
- **Data Export** — Tabulated numerical output may be downloaded for external reference

### Interface Options

- **App switcher** — a 3×3 grid button next to the logo opens the other vetin applications
- **Light / Dark mode** — selectable display theme
- **Fullscreen mode** — for unobstructed model construction
- **Configurable grid** — horizontal scale (m), vertical scale (kN), and grid resolution (px)
- **Contextual guidance** — a dynamic hint panel provides task-specific usage instructions for each selected tool

---

## 🎓 Learning Features

The tool is designed to teach *how* internal force diagrams are obtained, not only to display them.

- **Statical determinacy status** — every model is classified as statically determinate, indeterminate (with degree, e.g. *r = 4 > 3*) or unstable (mechanism, no horizontal restraint, coincident supports, geometrically unstable), with an explanation instead of silently hiding the diagrams.
- **Step-by-step solution** — free body diagram and unknowns, load resultants and centroids, the equilibrium equations written term by term with numbers (ΣFx, ΣM, hinge conditions, ΣFy), the solution, an independent check, region-by-region V(x)/M(x) expressions and critical points.
- **Region equations** — q(x), V(x) and M(x) polynomials for every region (in global *x* or local *ξ*), the curve degree of each, and a check of *dM/dx = V*.
- **Method of sections** — drag or type the cut position, choose the left or right part, see the internal forces drawn in their positive directions with signed values, the resultant of the distributed load on the part, and the equilibrium equations of the part. On the shear diagram the area up to the cut is shaded (*area = ΔM*); on the moment diagram the tangent shows *slope = V*.
- **Annotated diagrams** — values at every critical point (both sides of a jump), (+)/(−) regions, *M*max where *V = 0*, *δ*max, point names (A, B, C …) shared by the model, the FBD, the diagrams and the tables; dashed guide lines through every event point.
- **Results tables** — reactions with directions, hinge forces, extreme values and a critical-point table (V⁻, V⁺, M⁻, M⁺); exported to CSV together with the input tables.
- **Sign convention** — a dedicated window (± button) shows the positive N, V, M, T on both cut faces, the load conventions and the differential relations.
- **Practice mode** — seeded random problems at three levels (the same seed, e.g. a student number, always gives the same problem). Reactions, diagrams and solutions stay hidden; the student enters reactions, V and M at critical points, the zero-shear point and the curve type of each region, and gets feedback targeted at common mistakes (sign error, forgotten jump, swapped reactions, moment at a hinge), graded hints and “show solution”.
- **Sharing and assignments** — a model link (`#m=…`, the model is encoded in the URL fragment and never sent to a server), a practice link (`#p=level:seed`), a printable solution report (print / PDF) and Moodle XML export of numerical questions for the current problem.
- **Curriculum-ordered examples** — 14 examples grouped as Basic / Intermediate / Advanced, each with a title and a learning objective, including an overhanging beam, an inclined load, a cantilever with torque, multi-hinge Gerber beams and an indeterminate beam that explains why it cannot be solved. The gallery can be reopened from the menu (Examples).
- **Editing** — every element (beam length, supports, hinges, loads) can be edited numerically in a dialog, from the canvas or the data tables; undo / redo (Ctrl+Z / Ctrl+Y); Esc cancels a drawing in progress; elements are kept on the beam.

---

## 🌐 Multilingual Support

The user interface is fully localised in **more than 30 languages**. The active language is selectable at runtime and persisted across sessions via `localStorage`. Primary languages include:

| Code | Language | Code | Language |
|------|----------|------|----------|
| `tr` | 🇹🇷 Turkish | `en` | 🇬🇧 English |
| `de` | 🇩🇪 German | `cn` | 🇨🇳 Chinese |
| `es` | 🇪🇸 Spanish | `fr` | 🇫🇷 French |
| `it` | 🇮🇹 Italian | `pt` | 🇧🇷 Portuguese |
| `ar` | 🇸🇦 Arabic | `ja` | 🇯🇵 Japanese |
| `ko` | 🇰🇷 Korean | `ru` | 🇷🇺 Russian |

Additional languages: Greek, Hebrew, Hindi, Bengali, Persian, Urdu, Thai, Indonesian, Tagalog, Nepali, Armenian, Romanian, Burmese, Uzbek, Dzongkha, Tajik, Kyrgyz, Bulgarian, Slovenian, Albanian, Georgian, and more.

---

## 🛠️ Technical Implementation

The application is implemented using standard web technologies without dependency on a JavaScript framework:

| Technology | Role |
|-----------|------|
| **HTML5 / CSS3 / JavaScript (ES6+)** | Core application architecture |
| **[Chart.js](https://www.chartjs.org/) 4.4.9** | Rendering of 2D internal force diagrams |
| **[Three.js](https://threejs.org/) 0.145.0** | WebGL-based 3D elastic curve visualisation |
| **Service Worker API** | Offline caching and PWA functionality |
| **Web App Manifest** | Home screen installation support |

All third-party libraries are version-pinned and served locally from the `vendor/` directory — no CDN dependency, enabling full offline operation.

---

## 📁 Project Structure

```
beam/
├── index.html              # Application entry point and HTML shell
├── manifest.json           # PWA manifest descriptor
├── sw.js                   # Service Worker (offline caching)
│
├── main.js                 # Initialisation sequence
├── setup.js                # Global state, colours, Chart.js helpers
├── model.js                # Model file format (metres, v2) ↔ runtime state (pixels)
├── actions.js              # Shared user actions (desktop + mobile): buttons, load/save, reset
├── app.js                  # Canvas redraw, coordinate conversion, updateAll()
├── solver.js               # Pure, metre-based solver (BeamSolver): determinacy, reactions, N/V/M/T, critical points, region polynomials, equations, elastic curve
├── calculations.js         # Bridge between the pixel model and the solver — analyzeBeam() returns results, draws nothing
├── learning-panel.js       # Critical-value labels, point names, status bar, results tables, sign convention window
├── solution-steps.js       # Step-by-step solution, region equations, printable solution report
├── practice.js             # Practice mode, seeded problem generator, share links, Moodle XML
├── load-dialog.js          # Numeric editing dialog for the beam, supports, hinges and loads
├── ui-handler.js           # Rendering of results (FBD, diagrams), tables, theme, modals
├── cut-method.js           # Interactive method of sections
├── fullscreen-panels.js    # Drawings shown below the model in fullscreen
│
├── draw-structure.js       # Beam and support element rendering
├── draw-loads.js           # Load visualisation
├── draw-utilities.js       # Shared drawing utilities
├── elastic-3d.js           # Three.js-based 3D elastic curve renderer
│
├── desktop-events.js       # Mouse pointer interaction (drawing, dragging, drag & drop)
├── mobile-events.js        # Touch pointer interaction
├── download.js             # SVG, PNG, JSON and CSV export logic
│
├── translations.js         # Localisation string repository
├── translations-learning.js # Texts of the learning features; fills missing keys from English
├── localization.js         # Language switching and i18n engine
├── models-gallery.js       # Ready-made example model gallery
│
├── common.css              # Base styles and design tokens
├── desktop-layout.css      # Desktop viewport layout
├── mobile-layout.css       # Mobile viewport layout
├── controls-3d.css         # 3D viewer control panel styling
│
├── vendor/                 # Locally bundled third-party libraries
│   ├── chart.umd.min.js    #   Chart.js 4.4.9
│   ├── three.min.js        #   Three.js 0.145.0
│   └── OrbitControls.js    #   Three.js orbit camera controls
│
├── tests/
│   └── run-tests.js        # Unit tests (Node.js): solver, determinacy, practice generator, models, file format, deploy integrity
│
├── tools/
│   ├── build-models-data.js  # Generates models/models-data.js from models/*.json
│   └── check-deploy.js       # Pre-deploy check and list of files to upload
│
├── models/                 # Example models (.json, format v2) and embedded copy (models-data.js)
│
├── logo.svg                # Application logotype
├── icon-192.png            # PWA icon (192 × 192 px)
└── icon-512.png            # PWA icon (512 × 512 px)
```

---

## 🚀 Deployment and Local Execution

### Online Access (Recommended)

The application is hosted and publicly accessible at:  
**[https://www.rasimtemur.com/vetin/beam/](https://www.rasimtemur.com/vetin/beam/)**

### Local Execution

As the application comprises static files only, it may be served locally using any HTTP server:

```bash
# Clone the repository
git clone https://github.com/rasimtemur/vetin-beam.git
cd vetin-beam

# Python 3 — built-in HTTP server
python -m http.server 8000

# Node.js — via npx
npx serve .
```

Navigate to `http://localhost:8000` in a web browser to launch the application.

### Deploying to a Server

Before uploading, run the deploy check. It verifies that every file loaded by `index.html` is listed in the Service Worker cache (`sw.js`) and exists on disk — a single missing file prevents the Service Worker from installing — and prints the complete list of files to upload:

```bash
node tools/check-deploy.js --list
```

Upload the listed files preserving the folder structure (including `vendor/` and `models/`). After changing any file, increase `CACHE_NAME` in `sw.js` so that installed clients receive the update. After editing or adding an example model in `models/`, regenerate the embedded copy with `node tools/build-models-data.js`.

### Installation as a Progressive Web App

On browsers supporting the PWA specification (Chromium-based browsers, Firefox, Safari on iOS), the application may be installed to the device home screen or desktop via the browser's **"Install"** or **"Add to Home Screen"** functionality, enabling offline access.

---

## 📖 Usage

1. **Define the beam** — Activate the *Beam* tool and drag across the canvas to establish the beam axis and span.
2. **Assign boundary conditions** — Select a support type from the toolbar and click the desired location on the beam.
3. **Apply loading** — Select a load type and interact with the beam to define load position, magnitude, and direction as applicable.
4. **Examine results** — Internal force diagrams and reaction values are updated instantaneously following each model modification.
5. **Adjust deformation scale** — The *Displacement Scale* parameter may be increased to amplify the elastic curve for visual clarity.
6. **Export output** — The structural model and free body diagram (FBD) may be exported in vector format (SVG), while calculated diagrams can be saved as PNG images. The complete structural model can also be saved as a JSON file for session persistence.

> **Note:** A contextual hint panel is displayed below the canvas at all times, providing guidance specific to the currently active tool.

---

## 📐 Computational Methodology

- **Support reactions** are determined from the conditions of static equilibrium.
- **Internal force distributions** (axial force *N*, shear force *V*, bending moment *M*, torsional moment *T*) are obtained through numerical integration of the applied loading along the beam axis.
- **Elastic deformation** is computed by double integration of the bending moment diagram in accordance with the Euler–Bernoulli beam theory, utilising the specified values of *E* (modulus of elasticity) and *I* (second moment of area).
- The **three-dimensional elastic curve** provides a simultaneous representation of flexural (vertical) and torsional (lateral) deformations.
- **Sign convention (user interface):** distributed-load intensity *q* is entered and displayed as positive **downward**; point loads are entered with a positive magnitude and an angle measured clockwise from the horizontal (90° = downward); concentrated moments (couples) are positive **clockwise**. Internal forces: *N* > 0 tension, *V* > 0 downward on the right face of the left segment, *M* > 0 sagging (bottom fibres in tension; drawn below the axis in the BMD), *T* > 0 torque vector pointing out of the cut face.
- **Data file convention:** in the JSON file, distributed-load magnitudes are stored with the opposite sign (negative = downward), as in earlier versions, so existing files open unchanged.

---

## 🧪 Testing

The statics solver (support reactions, shear/moment functions, elastic curve, stability checks) is covered by unit tests that run in Node.js without a browser:

```bash
node tests/run-tests.js
```

The suite validates classical closed-form solutions (e.g. *R = Pb/L*, *M = wL²/2*, *M*max *= w₀L²/9√3*, *δ = PL³/3EI*) for simple, cantilever, overhanging and single- and multi-hinge Gerber beams, axial-force and torsion signs, the statical-determinacy classification, the method-of-sections equilibrium, the practice problem generator (always solvable, reproducible by seed), and each example model against its stored expected reactions and extreme moments. It also checks that the solver performs no drawing, that the model file format round-trips without loss (and still reads version 1 files), that the example models are valid, and that the deploy file lists are consistent.

---

## 📜 License

This software is distributed under the **MIT License**.  
Full license terms are available in the [LICENSE](LICENSE) file.

---

## 👤 Developer

**Assoc. Prof. Rasim Temür**  
Department of Civil Engineering  
Istanbul University-Cerrahpaşa  
🌐 [rasimtemur.com](https://www.rasimtemur.com)

---

## 🔗 Vetin Project

Vetin is a collection of open-source, browser-based computational tools developed for use in civil and structural engineering education. Additional tools within the Vetin ecosystem are accessible at **[rasimtemur.com/vetin](https://www.rasimtemur.com/vetin)**.

---

<p align="center">
  <i>Developed in support of engineering education.</i><br>
  <a href="https://github.com/rasimtemur/vetin-beam">GitHub</a> ·
  <a href="https://opensource.org/licenses/MIT">MIT License</a> ·
  <a href="https://www.iuc.edu.tr">Istanbul University-Cerrahpaşa</a>
</p>


## TrussVision Hackathon Extension

**Treat**: photograph a statics beam diagram, use image AI to propose the geometry and loading, review it in a Halloween engineering HUD, then import the result into Vetin's original solver with one click.

- Original Vetin Beam analysis is preserved at `/`.
- AI-powered TrussVision is available at `/trussvision/`.
- A button in the original simulator links to the AI importer.
- The extension uses Vetin model v2 JSON and calls the upstream `loadModelIntoApp` function; it does not duplicate the beam solver.
- Only dimensioned straight **2D beams** are transferred. Other problem types remain in TrussVision's own preview. Confirm AI-extracted values before calculating.
- The image input recognizes planar trusses, frames, friction/levers, pulley and rope systems, composite/centroid diagrams, spatial cables, and shaft/gear/bearing problems. These non-beam classes stay in TrussVision's review/visualization mode; they are not falsely imported into Vetin's beam solver.
- For the supplied problem screenshots, upload one cropped question at a time. The printed problem statement and diagram are the source of truth; handwritten work is treated as annotation and must be reviewed.
- The screenshot collection used for private testing is not part of this repository.
- GitHub Pages works as a static host: publish the repository root from the `main` branch, then use `/trussvision/` for the AI interface. The Netlify function is optional; static hosting falls back to the browser Gemini adapter.
- For local testing, run `py -3 -m http.server 8765` from the repository root and open `/` and `/trussvision/`. Enter a restricted Google AI Studio key only when testing image scans; it stays in memory and is sent directly to Google in static mode.
- For Netlify, use repository root as publish directory and `netlify/functions` as the functions directory. Configure `GEMINI_API_KEY` privately if using the server backend.
- GitHub Pages project sites use a repository subpath. The bridge and AI links resolve relative to that subpath, so the fork works at both a custom domain and `OWNER.github.io/REPOSITORY/`.
- AI disclosure: Gemini image parsing is non-deterministic, may misread symbols and units; the deterministic upstream solver runs on user-reviewed geometry.

TrussVision extension by hackathon team, extending the MIT-licensed Vetin Beam Analysis by Rasim Temür. See original MIT `LICENSE`.
