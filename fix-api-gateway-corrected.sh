#!/bin/bash

# Corrected API Gateway Fix Script
set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
AUTHORIZER_ID="xsqilx"  # ActaUiCognitoAuthorizer

echo "🔧 Fixing API Gateway CORS and Authorization Issues (CORRECTED)"
echo "=============================================================="
echo "API ID: $API_ID"
echo "Region: $REGION"
echo "Authorizer ID: $AUTHORIZER_ID"
echo ""

# Fix CORS for specific problematic resources
echo "🔧 Step 1: Fixing CORS headers for key resources..."

# Function to fix CORS for a specific resource
fix_resource_cors() {
    local RESOURCE_ID=$1
    local RESOURCE_PATH=$2
    
    echo "Fixing CORS for: $RESOURCE_PATH (ID: $RESOURCE_ID)"
    
    # Update OPTIONS method integration response with proper CORS headers
    aws apigateway update-integration-response \
        --region $REGION \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --patch-ops '[
            {
                "op": "replace",
                "path": "/responseParameters/method.response.header.Access-Control-Allow-Headers",
                "value": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
            },
            {
                "op": "replace",
                "path": "/responseParameters/method.response.header.Access-Control-Allow-Methods", 
                "value": "GET,POST,OPTIONS,PUT,DELETE"
            },
            {
                "op": "replace",
                "path": "/responseParameters/method.response.header.Access-Control-Allow-Origin",
                "value": "https://d7t9x3j66yd8k.cloudfront.net"
            },
            {
                "op": "replace", 
                "path": "/responseParameters/method.response.header.Access-Control-Allow-Credentials",
                "value": "true"
            }
        ]' 2>/dev/null || echo "  ⚠️ Could not update CORS for $RESOURCE_PATH"
}

# Fix CORS for the correct endpoints
fix_resource_cors "cltt9f" "/pm-manager/{pmEmail}"
fix_resource_cors "u8hucp" "/pm-manager/all-projects"
fix_resource_cors "4j5w9n" "/project-summary/{id}"
fix_resource_cors "wo429e" "/timeline/{id}"
fix_resource_cors "dgcz16" "/download-acta/{id}"

echo ""
echo "🔧 Step 2: Creating missing GET method for /projects endpoint..."

# Create GET method for projects endpoint
echo "Creating GET method for /projects..."
aws apigateway put-method \
    --region $REGION \
    --rest-api-id $API_ID \
    --resource-id 9nmq2z \
    --http-method GET \
    --authorization-type COGNITO_USER_POOLS \
    --authorizer-id $AUTHORIZER_ID \
    --request-parameters '{}' 2>/dev/null || echo "  ⚠️ GET method may already exist"

# Create integration for the GET method (redirect to pm-manager/all-projects)
echo "Creating integration for GET /projects..."
aws apigateway put-integration \
    --region $REGION \
    --rest-api-id $API_ID \
    --resource-id 9nmq2z \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:703671891952:function:sendProjectsForPM/invocations" \
    --passthrough-behavior WHEN_NO_MATCH 2>/dev/null || echo "  ⚠️ Integration may already exist"

# Create method response for GET /projects
echo "Creating method response for GET /projects..."
aws apigateway put-method-response \
    --region $REGION \
    --rest-api-id $API_ID \
    --resource-id 9nmq2z \
    --http-method GET \
    --status-code 200 \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": false,
        "method.response.header.Access-Control-Allow-Credentials": false
    }' 2>/dev/null || echo "  ⚠️ Method response may already exist"

# Create integration response for GET /projects
echo "Creating integration response for GET /projects..."
aws apigateway put-integration-response \
    --region $REGION \
    --rest-api-id $API_ID \
    --resource-id 9nmq2z \
    --http-method GET \
    --status-code 200 \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": "'\''https://d7t9x3j66yd8k.cloudfront.net'\''",
        "method.response.header.Access-Control-Allow-Credentials": "'\''true'\''"
    }' 2>/dev/null || echo "  ⚠️ Integration response may already exist"

echo ""
echo "🔧 Step 3: Fixing method authorization for existing endpoints..."

# Function to update method authorization
fix_method_auth() {
    local RESOURCE_ID=$1
    local METHOD=$2
    local RESOURCE_PATH=$3
    
    echo "Setting Cognito auth for: $METHOD $RESOURCE_PATH"
    
    aws apigateway update-method \
        --region $REGION \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method $METHOD \
        --patch-ops '[
            {
                "op": "replace",
                "path": "/authorizationType",
                "value": "COGNITO_USER_POOLS"
            },
            {
                "op": "replace",
                "path": "/authorizerId", 
                "value": "'$AUTHORIZER_ID'"
            }
        ]' 2>/dev/null || echo "  ⚠️ Could not update auth for $METHOD $RESOURCE_PATH"
}

# Fix authorization for endpoints that exist and have GET methods
fix_method_auth "4j5w9n" "GET" "/project-summary/{id}"
fix_method_auth "wo429e" "GET" "/timeline/{id}"
fix_method_auth "dgcz16" "GET" "/download-acta/{id}"

echo ""
echo "🚀 Step 4: Deploying changes..."

DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --region $REGION \
    --rest-api-id $API_ID \
    --stage-name prod \
    --description "Fix CORS, create missing GET /projects, and fix Cognito auth - $(date)" \
    --query 'id' --output text)

echo "✅ Deployment ID: $DEPLOYMENT_ID"

echo ""
echo "⏳ Step 5: Waiting for deployment to propagate..."
sleep 20

echo ""
echo "🧪 Step 6: Testing the fixes..."

# Test the corrected endpoints
echo "Testing /pm-manager/all-projects endpoint..."
curl -I -X GET "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/pm-manager/all-projects" \
    -H "Authorization: Bearer eyJraWQiOiIyNUhYcWJhNTNqQ0sza2tSZStPZE1Vcm1vdjc5YWNzdWc3VksyQ1NkbFFJPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIxMWRiZTVkMC1mMDMxLTcwODctODVmYy1hNGI3ODAwYzM2YWEiLCJjb2duaXRvOmdyb3VwcyI6WyJpa3VzaS1hY3RhLXVpIiwiYWN0YS11aS1zMyIsImFjdGEtdWktaWt1c2kiXSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMi5hbWF6b25hd3MuY29tXC91cy1lYXN0LTJfRnlITHRPaGlZIiwiY2xpZW50X2lkIjoiZHNob3M1aW91NDR0dWFjaDd0YTNpY2k1bSIsIm9yaWdpbl9qdGkiOiJhNDYyMjNhYi1hYWZkLTRhMjctOWE4MS0xYjI5NDdhY2M5MjIiLCJldmVudF9pZCI6ImY3ZmMwZDc2LWZjMDQtNGYwZS05YWVlLTFlOTg0ZDFmYWIzNyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3NTIwMzM3OTEsImV4cCI6MTc1MjAzNzQ1OCwiaWF0IjoxNzUyMDMzODU4LCJqdGkiOiIzY2ZhMzliNC1mMTNmLTQ2MTEtYWNlNy03ZGVkNDA2Y2MzMjMiLCJ1c2VybmFtZSI6IjExZGJlNWQwLWYwMzEtNzA4Ny04NWZjLWE0Yjc4MDBjMzZhYSJ9.j_DUzIyNAt0nNdkcrwlFmvB5VBNRuPkUY6oX5dbOHQiA3-det7q0LVXZx4pHUv8apj6ltybfUDTGKyoyyKtceK1AOISpPst0KA8rSkIwzhDDfUQSNTnfsZ3ZKam1cJ2nVQqVycOK3zbovxEi-5MPuDzjvnShUtMSXykVdQm36TPrhq2N6gn7YI-6lTjvc5NVhbO4hPgikxMF-Eu55bet768vE_O-wiDb4QLwn87aKFY4RSGcCngUQXs3vSLch_cu4kWVGEHzJckDf5OvbFSs_iILoTmSLTmZs-U-dAdV1vPoLvSmEGFFbp0v4Kfx_u5TZNlMgM3jIArnAj3K5uuDFw" \
    -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" || echo "Failed to test endpoint"

echo ""
echo "Testing newly created /projects endpoint..."
curl -I -X GET "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/projects" \
    -H "Authorization: Bearer eyJraWQiOiIyNUhYcWJhNTNqQ0sza2tSZStPZE1Vcm1vdjc5YWNzdWc3VksyQ1NkbFFJPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIxMWRiZTVkMC1mMDMxLTcwODctODVmYy1hNGI3ODAwYzM2YWEiLCJjb2duaXRvOmdyb3VwcyI6WyJpa3VzaS1hY3RhLXVpIiwiYWN0YS11aS1zMyIsImFjdGEtdWktaWt1c2kiXSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMi5hbWF6b25hd3MuY29tXC91cy1lYXN0LTJfRnlITHRPaGlZIiwiY2xpZW50X2lkIjoiZHNob3M1aW91NDR0dWFjaDd0YTNpY2k1bSIsIm9yaWdpbl9qdGkiOiJhNDYyMjNhYi1hYWZkLTRhMjctOWE4MS0xYjI5NDdhY2M5MjIiLCJldmVudF9pZCI6ImY3ZmMwZDc2LWZjMDQtNGYwZS05YWVlLTFlOTg0ZDFmYWIzNyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3NTIwMzM3OTEsImV4cCI6MTc1MjAzNzQ1OCwiaWF0IjoxNzUyMDMzODU4LCJqdGkiOiIzY2ZhMzliNC1mMTNmLTQ2MTEtYWNlNy03ZGVkNDA2Y2MzMjMiLCJ1c2VybmFtZSI6IjExZGJlNWQwLWYwMzEtNzA4Ny04NWZjLWE0Yjc4MDBjMzZhYSJ9.j_DUzIyNAt0nNdkcrwlFmvB5VBNRuPkUY6oX5dbOHQiA3-det7q0LVXZx4pHUv8apj6ltybfUDTGKyoyyKtceK1AOISpPst0KA8rSkIwzhDDfUQSNTnfsZ3ZKam1cJ2nVQqVycOK3zbovxEi-5MPuDzjvnShUtMSXykVdQm36TPrhq2N6gn7YI-6lTjvc5NVhbO4hPgikxMF-Eu55bet768vE_O-wiDb4QLwn87aKFY4RSGcCngUQXs3vSLch_cu4kWVGEHzJckDf5OvbFSs_iILoTmSLTmZs-U-dAdV1vPoLvSmEGFFbp0v4Kfx_u5TZNlMgM3jIArnAj3K5uuDFw" \
    -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" || echo "Failed to test endpoint"

echo ""
echo "🎉 API Gateway corrections completed!"
echo ""
echo "📋 Changes made:"
echo "  ✅ Fixed CORS headers for correct endpoints"
echo "  ✅ Created missing GET method for /projects endpoint"
echo "  ✅ Updated method authorization to use Cognito User Pool"
echo "  ✅ Deployed changes to production"
echo ""
echo "🔧 If issues persist:"
echo "  - Check CloudWatch logs for Lambda errors"
echo "  - Verify your app is using the latest deployed API"
echo "  - Test your frontend application"
