# TrussVision — cleanup and release review (October 18, 2026)

## Completed

1. Replaced seasonal visual branding with a restrained dark engineering workbench. Removed the separate seasonal CSS, theme controls, decorations, and the old themed verification image.
2. Fixed **horizontal point-load export**. The Vetin converter now preserves `fx` as well as `fy` for a point load, with a numerical regression assertion.
3. Strengthened **API-key handling** for static hosts: the Gemini key is placed in an `x-goog-api-key` request header rather than a query string. No API key is baked into the repository.
4. Made the scan fallback condition explicit: GitHub Pages / static host 404, 405, 501 and an intentionally unconfigured Netlify backend can fall back to the browser key. Other server errors are now surfaced rather than silently reattempted as user-key scans.
5. Added missing `spring2d` recognition to the static-host AI sanitizer, matching the server schema and deterministic spring demos.
6. Made scene selection **atomic**: a rejected JSON scene is validated before replacing the active scene.
7. Added keyboard activation and a visible focus state to the upload drop target; added a direct link to the official Google AI Studio key page inside AI settings.
8. Empty uploads are rejected and reselection of the same file is supported.
9. Removed origin-wide Cache Storage deletion from the root-level legacy service-worker migration; the redirect now limits service-worker retirement to the project scope, avoiding interference with other repositories sharing `github.io` origin.
10. Added a stronger `.gitignore`, updated CI triggers, refreshed README, and included `PUBLISHING_GUIDE.md` with existing team-repository instructions and attribution.

## Verification performed

- Node syntax checks: passed for TrussVision, Netlify, test and tooling scripts.
- `node tests/run-tests.js`: **210 passed, 0 failed**.
- `node tests/hibbeler-regression.js`: **63 assertions passed**.
- `node tests/trussvision-checks.js`: **23 passed, 0 failed** (includes new assertions).
- `node tests/truss-regression.js`: **passed**.
- `node tests/statics-regression.js`: **8 cases passed**.
- `node tests/ce211-paper-benchmarks.js`: **25 assertions passed**.
- `node tools/check-deploy.js`: **79 local file references verified**.

## Limits and remaining work

- No live scan with a real Google API key was possible here; key validity, model quotas, Google API availability and CORS depend on the actual deployment.
- A headless Chromium screenshot attempt timed out in this environment; **do not interpret the Node checks as a successful full browser UX test**. Open the published site and exercise upload, demo selection, mobile layout, pointer behavior, and the handoff before posting it publicly.
- The original Vetin solver is a separately maintained MIT-licensed application. Its large files and bundled dependencies were deliberately left intact rather than refactored without an end-to-end UI test.
- `trussvision/app.js` mixes state, canvas rendering and event handling. Splitting those responsibilities into modules would help future maintenance but was intentionally deferred to avoid unnecessary release risk.
- The optional Netlify function does not have built-in user authentication or rate limiting. Do not publicly deploy with a shared billable server key without abuse protection.
- AI extraction remains probabilistic and requires human verification. Supported numerical benchmarks do not establish general image-to-answer correctness or professional design suitability.
