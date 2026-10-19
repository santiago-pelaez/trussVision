#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
for i in 1 2 3 4 5 6; do
  echo "PASS $i / 6"
  node tests/run-tests.js > /tmp/tv_vetin_hibbeler_${i}.log
  grep -E "Sonuç:|successful|passed" /tmp/tv_vetin_hibbeler_${i}.log | tail -n 1
  node tests/trussvision-checks.js | grep "TrussVision result:"
  node tests/truss-regression.js | tail -n 1
  node tests/statics-regression.js | tail -n 1
  node tests/ce211-paper-benchmarks.js | tail -n 1
  node tests/hibbeler-regression.js
  node tools/check-deploy.js
  for f in trussvision/*.js netlify/functions/analyze.cjs; do node --check "$f" >/dev/null; done
  echo "PASS $i COMPLETE"
done
