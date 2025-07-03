#!/usr/bin/env bash
# purge_orphans.sh – delete API Gateway methods with no integration
set -euo pipefail

API_ID="q2b9avfwv5"      # ← your RestApiId
REGION="us-east-2"       # ← region

echo "🔍 Scanning API $API_ID for orphaned methods…"

# 1. collect “method  resourceId” pairs where methodIntegration is null
orphan_lines=$(
  aws apigateway get-resources \
      --rest-api-id "$API_ID" \
      --region      "$REGION" \
      --embeded     methods |                                # ← spelling per AWS CLI v1
  jq -r '
    .items[]
    | select(.resourceMethods!=null)             # only resources that *have* methods
    | . as $r
    | $r.resourceMethods
    | to_entries[]
    | select(.value.methodIntegration == null)   # integration missing ⇒ orphan
    | "\(.key) \($r.id)"                         # eg  "GET abcd1234"
  ' )

if [[ -z "$orphan_lines" ]]; then
  echo "✅ No orphaned methods found – nothing to purge."
  exit 0
fi

# 2. delete each orphaned method
while read -r HTTP_METHOD RID; do
  [[ -z "$HTTP_METHOD" || -z "$RID" ]] && continue
  echo "🗑️  Deleting $HTTP_METHOD on resource $RID…"
  aws apigateway delete-method \
      --rest-api-id "$API_ID" \
      --resource-id "$RID" \
      --http-method "$HTTP_METHOD" \
      --region "$REGION"
done <<< "$orphan_lines"

echo "✅ Orphaned methods removed."
