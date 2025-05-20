# scripts/smoke_ui.sh ─ place at repo root, then:  bash scripts/smoke_ui.sh
set -euo pipefail
DIST_ID="${CLOUDFRONT_DIST_ID:-$(aws cloudfront list-distributions \
         --query 'DistributionList.Items[?Comment==`acta-ui-prod`].Id|[0]' \
         --output text)}"

DOMAIN=$(aws cloudfront get-distribution --id "$DIST_ID" \
          --query 'Distribution.DomainName' --output text)

echo "🔍  Hitting https://$DOMAIN …"
STATUS=$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN")
[ "$STATUS" = "200" ] || { echo "❌  Expected 200, got $STATUS"; exit 1; }

grep -q 'Acta Platform' <(curl -s "https://$DOMAIN") \
  && echo "✅  React bundle served" || \
  { echo "❌  Unexpected HTML (maybe Storybook)"; exit 1; }
