#!/bin/bash
# IAM Role Permissions Fix for ACTA-UI
# This script attaches the required inline policy to ActaUI-DynamoDB-AuthenticatedRole

set -e

ROLE_NAME="ActaUI-DynamoDB-AuthenticatedRole"
POLICY_NAME="ActaUI-DynamoDB-S3-Policy"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 IAM Role Permissions Fix for ACTA-UI${NC}"
echo "======================================="
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Configuring IAM Role: ${ROLE_NAME}${NC}"
echo ""

# Check if role exists
echo -e "${YELLOW}🔍 Checking if IAM role exists...${NC}"
if aws iam get-role --role-name $ROLE_NAME &>/dev/null; then
    echo -e "${GREEN}✅ IAM role $ROLE_NAME found${NC}"
else
    echo -e "${RED}❌ IAM role $ROLE_NAME not found${NC}"
    echo "Please create the IAM role first or check the role name."
    exit 1
fi

# Create the policy document
echo -e "${YELLOW}📝 Creating policy document...${NC}"
cat > /tmp/acta-ui-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:Scan"],
      "Resource": "arn:aws:dynamodb:us-east-2:703671891952:table/ProjectPlace_DataExtrator_landing_table_v2"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::projectplace-dv-2025-x9a7b/*"
    }
  ]
}
EOF

echo -e "${GREEN}✅ Policy document created${NC}"
echo ""
echo "Policy contents:"
cat /tmp/acta-ui-policy.json
echo ""

# Attach the inline policy to the role
echo -e "${YELLOW}🔗 Attaching inline policy to IAM role...${NC}"
if aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name $POLICY_NAME \
    --policy-document file:///tmp/acta-ui-policy.json; then
    echo -e "${GREEN}✅ Inline policy attached successfully${NC}"
else
    echo -e "${RED}❌ Failed to attach inline policy${NC}"
    exit 1
fi

# Verify the policy was attached
echo -e "${YELLOW}🔍 Verifying policy attachment...${NC}"
if aws iam get-role-policy \
    --role-name $ROLE_NAME \
    --policy-name $POLICY_NAME &>/dev/null; then
    echo -e "${GREEN}✅ Policy verification successful${NC}"
    
    echo ""
    echo "Current policy:"
    aws iam get-role-policy \
        --role-name $ROLE_NAME \
        --policy-name $POLICY_NAME \
        --output table
else
    echo -e "${RED}❌ Policy verification failed${NC}"
    exit 1
fi

# Clean up temporary file
rm -f /tmp/acta-ui-policy.json

echo ""
echo -e "${GREEN}🎉 IAM Role Configuration Complete!${NC}"
echo ""
echo "The IAM role $ROLE_NAME now has permissions for:"
echo "  ✅ DynamoDB: GetItem, Scan on ProjectPlace_DataExtrator_landing_table_v2"
echo "  ✅ S3: GetObject on projectplace-dv-2025-x9a7b bucket"
echo ""
echo -e "${GREEN}🎯 Next: Run the deployment script to test the complete setup${NC}"