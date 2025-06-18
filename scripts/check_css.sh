#!/usr/bin/env bash
set -euo pipefail
PROD="https://d7t9x3j66yd8k.cloudfront.net"
html=$(curl -fsSL "$PROD/index.html")
css_path=$(echo "$html" | grep -Eo 'assets/index-[^"]+\.css' | head -n1)
[ -n "$css_path" ] || { echo "CSS link not found" >&2; exit 1; }
status=$(curl -s -o /dev/null -w '%{http_code}' "$PROD/$css_path")
if [ "$status" != "200" ]; then
  echo "CSS returned status $status" >&2
  exit 1
fi
