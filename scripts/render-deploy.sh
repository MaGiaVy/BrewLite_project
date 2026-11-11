#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 4 ]]; then
  echo 'Usage: render-deploy.sh <hook> <api-token> <service-id> <image>' >&2
  exit 2
fi

hook="$1"
token="$2"
service_id="$3"
image="$4"

[[ -n "$hook" && -n "$token" && "$service_id" =~ ^srv-[a-zA-Z0-9]+$ && "$image" == ghcr.io/*:* ]] || {
  echo 'Missing or invalid Render deployment configuration.' >&2
  exit 2
}

# The hook may contain secret query parameters; never print its URL.
response=$(curl --fail --silent --show-error --max-time 30 --get   --data-urlencode "imgURL=$image" "$hook")
deploy_id=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("deploy",{}).get("id", ""))' <<< "$response")
[[ "$deploy_id" =~ ^dep-[a-zA-Z0-9]+$ ]] || {
  echo 'Render did not return a deploy ID (may be queued). Refusing to report success.' >&2
  exit 1
}
echo "Render accepted deployment $deploy_id for $image"

for ((attempt=1; attempt<=60; attempt++)); do
  payload=$(curl --fail --silent --show-error --max-time 20     -H "Authorization: Bearer $token"     "https://api.render.com/v1/services/$service_id/deploys/$deploy_id")
  result=$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("status", "") + "|" + (d.get("image") or {}).get("ref", ""))' <<< "$payload")
  status="${result%%|*}"
  ref="${result#*|}"
  echo "Deploy $deploy_id: $status ($attempt/60)"
  case "$status" in
    live)
      [[ "$ref" == "$image" ]] || {
        echo "Unexpected deployed image: $ref" >&2
        exit 1
      }
      echo 'Render reports expected image LIVE.'
      exit 0
      ;;
    build_failed|update_failed|pre_deploy_failed|canceled|deactivated)
      echo "Render deployment failed: $status" >&2
      exit 1
      ;;
    created|queued|build_in_progress|update_in_progress|pre_deploy_in_progress) ;;
    *) echo "Unexpected Render status: $status" >&2; exit 1 ;;
  esac
  if ((attempt < 60)); then sleep 15; fi
done

echo 'Render deployment did not reach LIVE before timeout.' >&2
exit 1
