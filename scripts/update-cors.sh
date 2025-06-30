#!/bin/bash

# Update CORS settings for API Gateway endpoints
API_ID="q2b9avfwv5"
REGION="us-east-2"

# List of resource IDs and methods
RESOURCES=(
  "u8hucp" # pm-manager/all-projects
  "cltt9f" # pm-manager/{pmEmail}
  "9nmq2z" # projects
)

for RESOURCE_ID in "${RESOURCES[@]}"; do
  echo "Updating CORS for resource ID $RESOURCE_ID..."

  # Add CORS integration
  aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Origin": "'*'",
      "method.response.header.Access-Control-Allow-Methods": "'GET, HEAD, OPTIONS, POST'",
      "method.response.header.Access-Control-Allow-Headers": "'Content-Type, Authorization'"
    }' \
    --region "$REGION"

done

echo "CORS settings updated successfully."
