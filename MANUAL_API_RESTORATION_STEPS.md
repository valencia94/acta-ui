# 🔧 Manual API Gateway Integration Restoration

Since we can't run the automated script, here are the exact AWS CLI commands to restore the API integrations:

## Step 1: Set AWS Credentials

```bash
export AWS_DEFAULT_REGION=us-east-2

# If using user credentials directly:
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key

# OR assume the role:
aws sts assume-role --role-arn arn:aws:iam::703671891952:role/service-role/codebuild-acta-ui-service-role --role-session-name api-fix
```

## Step 2: Get Resource IDs

```bash
# Get approve resource ID
APPROVE_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id q2b9avfwv5 --query "items[?pathPart=='approve'].id" --output text)
echo "Approve Resource ID: $APPROVE_RESOURCE_ID"

# Get pm-manager resource ID
PM_MANAGER_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id q2b9avfwv5 --query "items[?pathPart=='pm-manager'].id" --output text)
echo "PM Manager Resource ID: $PM_MANAGER_RESOURCE_ID"

# Get all-projects resource ID
ALL_PROJECTS_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id q2b9avfwv5 --query "items[?pathPart=='all-projects' && parentId=='$PM_MANAGER_RESOURCE_ID'].id" --output text)
echo "All Projects Resource ID: $ALL_PROJECTS_RESOURCE_ID"

# Get {pmEmail} resource ID
EMAIL_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id q2b9avfwv5 --query "items[?pathPart=='{pmEmail}' && parentId=='$PM_MANAGER_RESOURCE_ID'].id" --output text)
echo "Email Resource ID: $EMAIL_RESOURCE_ID"
```

## Step 3: Fix /approve endpoint

```bash
# Create ANY method integration for /approve
aws apigateway put-integration \
  --rest-api-id q2b9avfwv5 \
  --resource-id $APPROVE_RESOURCE_ID \
  --http-method ANY \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher/invocations"

# Create CORS for /approve
aws apigateway put-integration \
  --rest-api-id q2b9avfwv5 \
  --resource-id $APPROVE_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --integration-http-method OPTIONS \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}'

aws apigateway put-integration-response \
  --rest-api-id q2b9avfwv5 \
  --resource-id $APPROVE_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'",
    "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,HEAD,OPTIONS,POST'"'"'",
    "method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,Authorization'"'"'"
  }'
```

## Step 4: Fix /pm-manager/all-projects endpoint

```bash
# Create GET method integration
aws apigateway put-integration \
  --rest-api-id q2b9avfwv5 \
  --resource-id $ALL_PROJECTS_RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher/invocations"

# Create CORS
aws apigateway put-integration \
  --rest-api-id q2b9avfwv5 \
  --resource-id $ALL_PROJECTS_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --integration-http-method OPTIONS \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}'
```

## Step 5: Fix /pm-manager/{pmEmail} endpoint

```bash
# Create GET method integration
aws apigateway put-integration \
  --rest-api-id q2b9avfwv5 \
  --resource-id $EMAIL_RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher/invocations"

# Create CORS
aws apigateway put-integration \
  --rest-api-id q2b9avfwv5 \
  --resource-id $EMAIL_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --integration-http-method OPTIONS \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}'
```

## Step 6: Deploy Changes

```bash
# Create deployment to make changes active
aws apigateway create-deployment \
  --rest-api-id q2b9avfwv5 \
  --stage-name prod \
  --description "Restore manual integrations after CloudFormation override"
```

## Step 7: Test Endpoints

```bash
# Test the restored endpoints
curl -I "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/approve"
curl -I "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/pm-manager/all-projects"
curl -I "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/pm-manager/test@example.com"
```

## Expected Results:

- HTTP 403 (Authentication required) = ✅ Working
- HTTP 200 = ✅ Working
- HTTP 404 = ❌ Still broken

Once you see 403 or 200 responses, the integrations are restored and your PDF preview feature will work perfectly! 🚀
