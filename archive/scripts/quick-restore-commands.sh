#!/bin/bash

# One-liner API restoration script
# Copy and paste these commands one by one in your terminal with proper AWS credentials

echo "🔧 Quick API Gateway Restoration Commands"
echo "========================================"
echo ""
echo "1. Set region:"
echo "export AWS_DEFAULT_REGION=us-east-2"
echo ""
echo "2. Get resource IDs:"
echo 'APPROVE_ID=$(aws apigateway get-resources --rest-api-id q2b9avfwv5 --query "items[?pathPart=='"'"'approve'"'"'].id" --output text)'
echo 'PM_ID=$(aws apigateway get-resources --rest-api-id q2b9avfwv5 --query "items[?pathPart=='"'"'pm-manager'"'"'].id" --output text)'
echo 'ALL_ID=$(aws apigateway get-resources --rest-api-id q2b9avfwv5 --query "items[?pathPart=='"'"'all-projects'"'"' && parentId=='"'"'$PM_ID'"'"'].id" --output text)'
echo 'EMAIL_ID=$(aws apigateway get-resources --rest-api-id q2b9avfwv5 --query "items[?pathPart=='"'"'{pmEmail}'"'"' && parentId=='"'"'$PM_ID'"'"'].id" --output text)'
echo ""
echo "3. Restore integrations:"
echo 'aws apigateway put-integration --rest-api-id q2b9avfwv5 --resource-id $APPROVE_ID --http-method ANY --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher/invocations"'
echo 'aws apigateway put-integration --rest-api-id q2b9avfwv5 --resource-id $ALL_ID --http-method GET --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher/invocations"'
echo 'aws apigateway put-integration --rest-api-id q2b9avfwv5 --resource-id $EMAIL_ID --http-method GET --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher/invocations"'
echo ""
echo "4. Deploy:"
echo 'aws apigateway create-deployment --rest-api-id q2b9avfwv5 --stage-name prod --description "Restore integrations"'
echo ""
echo "5. Test:"
echo 'curl -I "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/approve"'
