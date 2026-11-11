#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 3 ]]; then
  echo 'Usage: bash scripts/smoke-test.sh <api-base-url> [attempts] [delay-seconds]' >&2
  exit 2
fi

base="${1%/}"
attempts="${2:-20}"
delay="${3:-10}"
[[ "$base" =~ ^https?://[^/]+ ]] || { echo 'Invalid URL' >&2; exit 2; }
[[ "$attempts" =~ ^[1-9][0-9]*$ && "$delay" =~ ^[0-9]+$ ]] || exit 2

for endpoint in health products; do
  success=0
  for ((i=1; i<=attempts; i++)); do
    if curl --fail --silent --show-error --max-time 15 "$base/$endpoint" > /dev/null; then
      echo "PASS /$endpoint (attempt $i)"
      success=1
      break
    fi
    echo "Retry /$endpoint ($i/$attempts)"
    if ((i < attempts)); then sleep "$delay"; fi
  done
  if ((success == 0)); then
    echo "FAIL /$endpoint" >&2
    exit 1
  fi
done
