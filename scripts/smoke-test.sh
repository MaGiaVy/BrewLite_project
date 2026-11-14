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

check_endpoint() {
  local endpoint="$1"
  local pattern="$2"
  local success=0
  local body=""

  for ((i=1; i<=attempts; i++)); do
    if body=$(curl --fail --silent --show-error --max-time 15 "$base/$endpoint"); then
      if [[ -z "$pattern" ]] || grep -Eq "$pattern" <<< "$body"; then
        echo "PASS /$endpoint (attempt $i)"
        success=1
        break
      fi
      echo "Retry /$endpoint ($i/$attempts): unexpected payload"
    else
      echo "Retry /$endpoint ($i/$attempts)"
    fi
    if ((i < attempts)); then sleep "$delay"; fi
  done

  if ((success == 0)); then
    echo "FAIL /$endpoint" >&2
    exit 1
  fi
}

check_endpoint "health" '"status"[[:space:]]*:[[:space:]]*"ok".*"db"[[:space:]]*:[[:space:]]*"up"|"db"[[:space:]]*:[[:space:]]*"up".*"status"[[:space:]]*:[[:space:]]*"ok"'
check_endpoint "products" '"data"[[:space:]]*:[[:space:]]*\['
