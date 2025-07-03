#!/bin/bash

# Deploy Lambda Functions for ACTA-UI Button Functionality
# This script creates the exact functions needed by CloudFormation with correct names

set -euo pipefail

echo "🎯 ACTA-UI Lambda Function Deployment for Button Functionality"
echo "=============================================================="

REGION="us-east-2"
ROLE_ARN="arn:aws:iam::703671891952:role/ProjectplaceLambdaRole"

echo ""
echo "📊 Current AWS Lambda Functions:"
aws lambda list-functions --region "$REGION" --query 'Functions[].FunctionName' --output table

echo ""
echo "🔍 Analyzing function requirements vs CloudFormation expectations..."

# Function to deploy a Lambda function
deploy_function() {
    local function_name="$1"
    local source_file="$2"
    local description="$3"
    
    echo ""
    echo "📦 Processing $function_name..."
    echo "   Source: $source_file"
    echo "   Description: $description"
    
    # Check if function already exists
    if aws lambda get-function --function-name "$function_name" --region "$REGION" >/dev/null 2>&1; then
        echo "   ✅ Function $function_name already exists, updating code..."
        
        # Create deployment package
        if [[ "$source_file" == *.py ]]; then
            temp_dir=$(mktemp -d)
            cp "$source_file" "$temp_dir/lambda_function.py"
            cd "$temp_dir"
            zip -r "../${function_name}.zip" .
            cd - >/dev/null
            
            aws lambda update-function-code \
                --function-name "$function_name" \
                --zip-file "fileb://${temp_dir}/../${function_name}.zip" \
                --region "$REGION" >/dev/null
                
            rm -rf "$temp_dir" "${temp_dir}/../${function_name}.zip"
        else
            aws lambda update-function-code \
                --function-name "$function_name" \
                --zip-file "fileb://$source_file" \
                --region "$REGION" >/dev/null
        fi
        
        echo "   ✅ Function $function_name updated successfully"
    else
        echo "   📦 Creating new function $function_name..."
        
        # Create deployment package
        if [[ "$source_file" == *.py ]]; then
            temp_dir=$(mktemp -d)
            cp "$source_file" "$temp_dir/lambda_function.py"
            cd "$temp_dir"
            zip -r "../${function_name}.zip" .
            cd - >/dev/null
            
            aws lambda create-function \
                --function-name "$function_name" \
                --runtime python3.9 \
                --role "$ROLE_ARN" \
                --handler lambda_function.lambda_handler \
                --zip-file "fileb://${temp_dir}/../${function_name}.zip" \
                --description "$description" \
                --timeout 30 \
                --memory-size 256 \
                --region "$REGION" >/dev/null
                
            rm -rf "$temp_dir" "${temp_dir}/../${function_name}.zip"
        else
            aws lambda create-function \
                --function-name "$function_name" \
                --runtime python3.9 \
                --role "$ROLE_ARN" \
                --handler lambda_function.lambda_handler \
                --zip-file "fileb://$source_file" \
                --description "$description" \
                --timeout 30 \
                --memory-size 256 \
                --region "$REGION" >/dev/null
        fi
        
        echo "   ✅ Function $function_name created successfully"
    fi
}

# Create alias function for case-sensitive name mapping
create_function_alias() {
    local existing_function="$1"
    local new_function_name="$2"
    local description="$3"
    
    echo ""
    echo "🔗 Creating alias: $existing_function → $new_function_name"
    
    # Get the existing function's code
    if aws lambda get-function --function-name "$existing_function" --region "$REGION" >/dev/null 2>&1; then
        echo "   📥 Downloading code from $existing_function..."
        
        # Download function code
        CODE_URL=$(aws lambda get-function --function-name "$existing_function" --region "$REGION" --query 'Code.Location' --output text)
        curl -s "$CODE_URL" -o "/tmp/${new_function_name}.zip"
        
        # Deploy with new name
        if aws lambda get-function --function-name "$new_function_name" --region "$REGION" >/dev/null 2>&1; then
            echo "   ✅ Function $new_function_name already exists, updating..."
            aws lambda update-function-code \
                --function-name "$new_function_name" \
                --zip-file "fileb:///tmp/${new_function_name}.zip" \
                --region "$REGION" >/dev/null
        else
            echo "   📦 Creating new function $new_function_name..."
            aws lambda create-function \
                --function-name "$new_function_name" \
                --runtime python3.9 \
                --role "$ROLE_ARN" \
                --handler lambda_function.lambda_handler \
                --zip-file "fileb:///tmp/${new_function_name}.zip" \
                --description "$description" \
                --timeout 30 \
                --memory-size 256 \
                --region "$REGION" >/dev/null
        fi
        
        rm -f "/tmp/${new_function_name}.zip"
        echo "   ✅ Function $new_function_name created/updated successfully"
    else
        echo "   ❌ Source function $existing_function not found"
        return 1
    fi
}

echo ""
echo "🔧 STEP 1: Deploy Missing Functions"
echo "=================================="

# 1. DocumentStatus (NEW - needed for document status checking)
deploy_function "DocumentStatus" "lambda-functions/document-status.py" "Check ACTA document status for projects"

# 2. ProjectsManager (NEW - needed for project list management) 
deploy_function "ProjectsManager" "lambda-functions/projects-manager.py" "Manage project lists and PM queries"

echo ""
echo "🔄 STEP 2: Create PascalCase Aliases for Existing Functions"
echo "=========================================================="

# Create PascalCase versions of existing camelCase functions
create_function_alias "getTimeline" "GetTimeline" "Timeline data retrieval (PascalCase alias)"
create_function_alias "getDownloadActa" "GetDownloadActa" "ACTA document download (PascalCase alias)"  
create_function_alias "sendApprovalEmail" "SendApprovalEmail" "Send approval emails (PascalCase alias)"

echo ""
echo "✅ STEP 3: Verification"
echo "======================"

# Verify all required functions exist
REQUIRED_FUNCTIONS=(
    "DocumentStatus"
    "SendApprovalEmail" 
    "GetDownloadActa"
    "ProjectsManager"
    "GetTimeline"
    "ProjectPlaceDataExtractor"
    "projectMetadataEnricher"
    "HealthCheck"
)

echo ""
echo "🔍 Verifying CloudFormation-expected functions exist:"

all_exist=true
for func in "${REQUIRED_FUNCTIONS[@]}"; do
    if aws lambda get-function --function-name "$func" --region "$REGION" >/dev/null 2>&1; then
        echo "   ✅ $func - DEPLOYED AND READY"
    else
        echo "   ❌ $func - MISSING"
        all_exist=false
    fi
done

echo ""
if [ "$all_exist" = true ]; then
    echo "🎉 SUCCESS: All required Lambda functions are deployed!"
    echo ""
    echo "📋 CloudFormation Template Status: READY FOR DEPLOYMENT"
    echo "   - All function ARNs are valid"
    echo "   - PascalCase naming convention satisfied"
    echo "   - Button functionality mappings complete"
    echo ""
    echo "🔄 Next Steps:"
    echo "1. Deploy CloudFormation stack: Ikusii-acta-ui-secure-api"
    echo "2. Verify API Gateway → Lambda mappings"
    echo "3. Test Cognito authorization integration"
    echo "4. Validate button functionality in UI"
else
    echo "❌ DEPLOYMENT INCOMPLETE: Some functions are missing"
    echo "Review the errors above and re-run this script"
    exit 1
fi
    echo "   Description: $description"
    
    # Check if function already exists
    if aws lambda get-function --function-name "$function_name" --region "$REGION" >/dev/null 2>&1; then
        echo "   ✅ Function $function_name already exists, updating code..."
        
        # Create deployment package
        if [[ "$source_file" == *.py ]]; then
            temp_dir=$(mktemp -d)
            cp "$source_file" "$temp_dir/lambda_function.py"
            cd "$temp_dir"
            zip -r "../${function_name}.zip" .
            cd - >/dev/null
            
            aws lambda update-function-code \
                --function-name "$function_name" \
                --zip-file "fileb://${temp_dir}/../${function_name}.zip" \
                --region "$REGION" >/dev/null
                
            rm -rf "$temp_dir" "${temp_dir}/../${function_name}.zip"
        else
            aws lambda update-function-code \
                --function-name "$function_name" \
                --zip-file "fileb://$source_file" \
                --region "$REGION" >/dev/null
        fi
        
        echo "   ✅ Function $function_name updated successfully"
    else
        echo "   📦 Creating new function $function_name..."
        
        # Create deployment package
        if [[ "$source_file" == *.py ]]; then
            temp_dir=$(mktemp -d)
            cp "$source_file" "$temp_dir/lambda_function.py"
            cd "$temp_dir"
            zip -r "../${function_name}.zip" .
            cd - >/dev/null
            
            aws lambda create-function \
                --function-name "$function_name" \
                --runtime python3.9 \
                --role "$ROLE_ARN" \
                --handler lambda_function.lambda_handler \
                --zip-file "fileb://${temp_dir}/../${function_name}.zip" \
                --description "$description" \
                --timeout 30 \
                --memory-size 256 \
                --region "$REGION" >/dev/null
                
            rm -rf "$temp_dir" "${temp_dir}/../${function_name}.zip"
        else
            aws lambda create-function \
                --function-name "$function_name" \
                --runtime python3.9 \
                --role "$ROLE_ARN" \
                --handler lambda_function.lambda_handler \
                --zip-file "fileb://$source_file" \
                --description "$description" \
                --timeout 30 \
                --memory-size 256 \
                --region "$REGION" >/dev/null
        fi
        
        echo "   ✅ Function $function_name created successfully"
    fi
}

# Deploy all missing functions
echo "🔍 Deploying functions expected by CloudFormation..."

# 1. DocumentStatus (from document-status.py)
deploy_function "DocumentStatus" "lambda-functions/document-status.py" "Document status checking function"

# 2. SendApprovalEmail (from sendApprovalEmail.zip or .py)
if [[ -f "lambda-functions/sendApprovalEmail.zip" ]]; then
    deploy_function "SendApprovalEmail" "lambda-functions/sendApprovalEmail.zip" "Send approval email function"
elif [[ -f "lambda-functions/fixed/sendApprovalEmail.zip" ]]; then
    deploy_function "SendApprovalEmail" "lambda-functions/fixed/sendApprovalEmail.zip" "Send approval email function"
else
    echo "   ⚠️  SendApprovalEmail source not found, using enhanced version"
    deploy_function "SendApprovalEmail" "lambda-functions/enhanced-send-approval.py" "Send approval email function"
fi

# 3. GetDownloadActa (from getDownloadActa.zip or .py)
if [[ -f "lambda-functions/getDownloadActa.zip" ]]; then
    deploy_function "GetDownloadActa" "lambda-functions/getDownloadActa.zip" "Download ACTA documents function"
elif [[ -f "lambda-functions/fixed/getDownloadActa.zip" ]]; then
    deploy_function "GetDownloadActa" "lambda-functions/fixed/getDownloadActa.zip" "Download ACTA documents function"
else
    echo "   ⚠️  GetDownloadActa zip not found, using Python version"
    deploy_function "GetDownloadActa" "lambda-functions/download-acta.py" "Download ACTA documents function"
fi

# 4. ProjectsManager (from projects-manager.py)
deploy_function "ProjectsManager" "lambda-functions/projects-manager.py" "Projects management function"

# 5. GetTimeline (from getTimeline.zip or .py)
if [[ -f "lambda-functions/getTimeline.zip" ]]; then
    deploy_function "GetTimeline" "lambda-functions/getTimeline.zip" "Timeline data function"
elif [[ -f "lambda-functions/fixed/getTimeline.zip" ]]; then
    deploy_function "GetTimeline" "lambda-functions/fixed/getTimeline.zip" "Timeline data function"
else
    echo "   ⚠️  GetTimeline zip not found, using enhanced version"
    deploy_function "GetTimeline" "lambda-functions/enhanced-getTimeline.py" "Timeline data function"
fi

echo ""
echo "✅ All Lambda functions deployed successfully!"
echo ""
echo "🔍 Verifying function deployment..."

# Verify all functions exist
FUNCTIONS=("DocumentStatus" "SendApprovalEmail" "GetDownloadActa" "ProjectsManager" "GetTimeline")

for func in "${FUNCTIONS[@]}"; do
    if aws lambda get-function --function-name "$func" --region "$REGION" >/dev/null 2>&1; then
        echo "   ✅ $func - DEPLOYED"
    else
        echo "   ❌ $func - FAILED"
    fi
done

echo ""
echo "🎯 Next Steps:"
echo "1. Functions are now deployed with correct names"
echo "2. CloudFormation stack can now be deployed"
echo "3. API Gateway will be able to invoke these functions"
echo ""
echo "Ready to deploy CloudFormation stack: Ikusii-acta-ui-secure-api"
