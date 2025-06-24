#!/usr/bin/env bash
# Copy SPA shell for client-side routes
set -euo pipefail
for route in login dashboard; do
  mkdir -p "dist/$route"
  cp dist/index.html "dist/$route/index.html"
done
echo "✓ copied index.html → /login & /dashboard"
