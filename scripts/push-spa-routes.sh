#!/usr/bin/env bash
# scripts/push-spa-routes.sh
set -eux

[ -f dist/index.html ] || { echo "dist/index.html missing"; exit 1; }

for route in login dashboard; do
  mkdir -p "dist/$route"
  cp dist/index.html "dist/$route/index.html"
  aws s3 cp dist/index.html "s3://$BUCKET/$route"
  aws s3 cp dist/index.html "s3://$BUCKET/$route/index.html"
done

echo "✓ copied SPA routes"
