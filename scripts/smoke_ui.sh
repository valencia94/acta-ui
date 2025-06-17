#!/usr/bin/env bash
set -euo pipefail

: "${VITE_API_BASE_URL:?VITE_API_BASE_URL not set}"

status=$(curl -s -o /dev/null -w '%{http_code}' "$VITE_API_BASE_URL/projectSummary/demo")
[ "$status" = "200" ] || { echo "❌ projectSummary returned $status"; exit 1; }

data='{}'
status=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d "$data" "$VITE_API_BASE_URL/send-approval-email")
case "$status" in
  200|202) ;;
  *) echo "❌ send-approval-email returned $status"; exit 1;;
esac

html=$(curl -sL https://d7t9x3j66yd8k.cloudfront.net/)
status=$(curl -s -o /dev/null -w '%{http_code}' https://d7t9x3j66yd8k.cloudfront.net/)
[ "$status" = "200" ] || { echo "❌ cloudfront returned $status"; exit 1; }

echo "$html" | grep -q '<!DOCTYPE html>' || { echo "❌ cloudfront missing DOCTYPE"; exit 1; }

echo "✅ smoke tests passed"
