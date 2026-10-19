# Windows PC: update the team repository safely

The ZIP contains the **full updated fork**, including the existing TrussVision UI, Vetin, MIT license, and Netlify files. It does NOT contain the uploaded textbook or any secret API keys.

1. Back up the GitHub repository (create a fresh branch `feature/expanded-statics-engine` and commit local changes first).
2. Extract the ZIP into a NEW folder, outside your current Git checkout. Inspect the changed code and the `HIBBELER_COVERAGE_AND_LIMITS.md` file.
3. From the extracted folder run in PowerShell: `node tests/hibbeler-regression.js` and `node tests/trussvision-checks.js`. Also run `node tests/run-tests.js`, `node tests/statics-regression.js`, `node tests/truss-regression.js` and `node tools/check-deploy.js`.
4. If everything passes, copy the updated contents into your **actual GitHub clone** (preserving `.git/` and any unpublished work), review the diff in GitHub Desktop, commit and push to your feature branch. Do NOT replace your live site until the browser demonstrations and a real scan are tested.
5. To test locally: `py -3 -m http.server 8765` in the cloned repository; open `http://localhost:8765/trussvision/`. Select the new demonstrations in the left sidebar. Test spring, pulley, belt, centroid, frame, and 3D moment. Confirm Vetin still opens. For the scanner, enter your own API key in the app (don't commit it) or configure `GEMINI_API_KEY` on Netlify.
6. Compare the visual output and problem-analysis panel. Some types give `RESULTANT ONLY` or a stability warning; this is deliberate and should not be hidden.

The external GitHub fork and Netlify deployment were not modified by this archive. The project remains MIT-licensed subject to retained upstream attribution.
