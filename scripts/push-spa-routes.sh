#!/usr/bin/env bash
# Copy SPA shell for client-side routes
set -euo pipefail

[ -f dist/index.html ] || { echo "dist/index.html missing"; exit 1; }

for route in login dashboard; do
  mkdir -p "dist/$route"
  cp dist/index.html "dist/$route/index.html"
  if [[ -n "${DEPLOY_BUCKET:-}" ]]; then
    aws s3 cp dist/index.html "s3://$DEPLOY_BUCKET/$route"
    aws s3 cp dist/index.html "s3://$DEPLOY_BUCKET/$route/index.html"
  fi
done

if [ -f dist/health ]; then
  touch dist/health
fi

echo "✓ copied SPA routes"
