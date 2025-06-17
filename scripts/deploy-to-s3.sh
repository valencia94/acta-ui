#!/usr/bin/env bash
set -euo pipefail

aws s3 sync dist/ s3://acta-ui-frontend-prod/ --delete
aws cloudfront create-invalidation --distribution-id EPQU7PVDLQXUA --paths "/*"
