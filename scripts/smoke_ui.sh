#!/usr/bin/env bash
set -euo pipefail

: "${VITE_API_BASE_URL:?VITE_API_BASE_URL not set}"

check() {
  local msg=$1
  shift
  "$@" >/tmp/smoke_out 2>&1 || { cat /tmp/smoke_out; echo "❌ $msg"; exit 1; }
}

status=$(curl -s -o /dev/null -w '%{http_code}' "$VITE_API_BASE_URL/project-summary/demo")
[ "$status" = "200" ] || { echo "❌ project-summary returned $status"; exit 1; }

data='{}'
status=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d "$data" "$VITE_API_BASE_URL/sendapprovalemail")
case "$status" in
  200|202) ;;
  *) echo "❌ send-approval-email returned $status"; exit 1;;
esac

html=$(curl -sL https://d7t9x3j66yd8k.cloudfront.net/)
status=$(curl -s -o /dev/null -w '%{http_code}' https://d7t9x3j66yd8k.cloudfront.net/)
[ "$status" = "200" ] || { echo "❌ cloudfront returned $status"; exit 1; }

echo "$html" | grep -qi '<!doctype html>' || { echo "❌ cloudfront missing DOCTYPE"; exit 1; }

echo "✅ smoke tests passed"
