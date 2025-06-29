# ACTA-UI Lambda Function Fix - Manual Steps

## Current Status
Based on the system test, we have identified the following 502 errors:
- Project Summary Button: 502 error (Lambda: getProjectSummary)
- Timeline Load Button: 502 error (Lambda: getTimeline)  
- Download PDF Button: 502 error (Lambda: getDownloadActa)
- Download DOCX Button: 502 error (Lambda: getDownloadActa)
- Send Approval Button: 400 error (Lambda: sendApprovalEmail)

## Root Cause
The API Gateway is configured to call specific Lambda functions that either:
1. Don't exist
2. Are failing due to code issues
3. Don't have proper permissions

## Solution Prepared
We have created fixed Lambda function code and deployment scripts:

### Files Ready:
- `/workspaces/acta-ui/lambda-functions/fixed/GetProjectSummary.js.zip`
- `/workspaces/acta-ui/lambda-functions/fixed/GetTimeline.js.zip`
- `/workspaces/acta-ui/lambda-functions/fixed/GetDownloadActa.js.zip`
- `/workspaces/acta-ui/lambda-functions/fixed/SendApprovalEmail.js.zip`

### Deployment Scripts:
- `/workspaces/acta-ui/deploy-lambda-fixes-comprehensive.sh` - Complete deployment
- `/workspaces/acta-ui/refresh-aws-credentials.sh` - Get fresh credentials
- `/workspaces/acta-ui/test-complete-system.sh` - Verify the fix

## Manual Deployment Steps

### Step 1: Get Fresh AWS Credentials
You need to provide fresh AWS credentials with the full permissions you granted:

```bash
export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_KEY"
export AWS_SESSION_TOKEN="YOUR_SESSION_TOKEN"  # if using temporary credentials
export AWS_DEFAULT_REGION="us-east-2"
```

### Step 2: Run the Comprehensive Fix
```bash
cd /workspaces/acta-ui
./deploy-lambda-fixes-comprehensive.sh
```

### Step 3: Verify the Fix
```bash
./test-complete-system.sh
```

## Expected Results After Fix
- Project Summary Button: 200/403 (instead of 502)
- Timeline Load Button: 200/403 (instead of 502)
- Download PDF Button: 200/302/403 (instead of 502)
- Download DOCX Button: 200/302/403 (instead of 502)
- Send Approval Button: 200/403 (instead of 400)

## What the Deployment Script Does
1. Checks existing Lambda functions
2. Creates/updates the missing Lambda functions:
   - GetProjectSummary
   - GetTimeline  
   - GetDownloadActa
   - SendApprovalEmail
3. Sets proper API Gateway permissions
4. Tests each function
5. Runs comprehensive system test

## Manual Alternative (if script fails)
If the script fails, you can manually create each Lambda function:

```bash
# For each function:
aws lambda create-function \
  --function-name GetProjectSummary \
  --runtime nodejs18.x \
  --role arn:aws:iam::703671891952:role/acta-ui-lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://lambda-functions/fixed/GetProjectSummary.js.zip \
  --timeout 30 \
  --memory-size 256

# Add API Gateway permissions:
aws lambda add-permission \
  --function-name GetProjectSummary \
  --statement-id api-gateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-2:703671891952:q2b9avfwv5/*"
```

Repeat for GetTimeline, GetDownloadActa, and SendApprovalEmail.

## Next Steps After Successful Deployment
1. Test the frontend with authentication
2. Monitor CloudWatch logs for any remaining issues
3. Update frontend if any endpoint URLs need changes
4. Document the production-ready state
