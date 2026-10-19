#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
for pass in 1 2 3 4 5 6; do
  echo "===== validation run $pass / 6 ====="
  node tests/run-tests.js | tail -2
  node tests/trussvision-checks.js | tail -2
  node tests/truss-regression.js | tail -1
  node tests/statics-regression.js
  node tests/ce211-paper-benchmarks.js
  node tools/check-deploy.js | tail -2
  echo "RUN $pass PASS"
done
