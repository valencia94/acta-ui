#!/bin/bash
set -euo pipefail

API_ID="q2b9avfwv5"
REGION="us-east-2"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"
STAGE="prod"

# Add all relevant endpoints here
declare -a RESOURCES=(
  "check-document"
  "check-document/{projectId}"
  "timeline/{id}"
  "project-summary/{id}"
  "download-acta/{id}"
  "extract-project-place/{id}"
  "send-approval-email"
  "approve"
  "pm-manager/all-projects"
  "pm-manager/{pmEmail}"
  "projects"
)

echo "🔁 Enabling CORS for all paths..."

# Get root resource
ROOT_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" \
  --query 'items[?path==`/`].id' --output text)

# Function to enable CORS on a path
add_cors_options() {
  local path="$1"
  echo "⚙️  Processing: /$path"

  RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" \
    --query "items[?path=='/${path}'].id" --output text)

  if [[ "$RESOURCE_ID" == "None" || -z "$RESOURCE_ID" ]]; then
    echo "❌ Resource not found: /$path"
    return
  fi

  # Check if OPTIONS method already exists
  if aws apigateway get-method --rest-api-id "$API_ID" --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS --region "$REGION" >/dev/null 2>&1; then
    echo "🔄 OPTIONS method already exists — skipping creation, updating integration..."
  else
    aws apigateway put-method \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method OPTIONS \
      --authorization-type "NONE" \
      --region "$REGION"
  fi

  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region "$REGION"

  if aws apigateway get-method-response --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --region "$REGION" >/dev/null 2>&1; then
    echo "ℹ️  Method response 200 already exists — skipping."
  else
    aws apigateway put-method-response \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method OPTIONS \
      --status-code 200 \
      --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Credentials":true}' \
      --response-models '{"application/json":"Empty"}' \
      --region "$REGION"
  fi

  aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters \
    "method.response.header.Access-Control-Allow-Origin='${ORIGIN}',method.response.header.Access-Control-Allow-Methods='GET,POST,OPTIONS,HEAD',method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',method.response.header.Access-Control-Allow-Credentials='true'" \
    --response-templates '{"application/json":""}' \
    --region "$REGION"

  echo "✅ CORS updated for /$path"
  sleep 1
}

# Apply CORS for each route
for path in "${RESOURCES[@]}"; do
  add_cors_options "$path"
done

# Redeploy the API
aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE" \
  --region "$REGION"

echo "🎉 All CORS methods added and API redeployed to stage: $STAGE!"

