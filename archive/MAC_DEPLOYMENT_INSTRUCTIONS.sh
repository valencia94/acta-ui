#!/bin/bash

# DEPLOYMENT COMMANDS FOR MAC
# Run these commands from your local acta-ui directory

echo "🚀 Setting up conflict-free backend deployment on Mac"
echo "=================================================="

echo "1. Pull latest changes from develop branch:"
echo "   git pull origin develop"
echo

echo "2. Verify the new files exist:"
echo "   ls -la infra/template-conflict-free.yaml"
echo "   ls -la deploy-conflict-free-backend.sh"
echo "   ls -la CONFLICT_FREE_SOLUTION.md"
echo

echo "3. Make deployment script executable:"
echo "   chmod +x deploy-conflict-free-backend.sh"
echo

echo "4. Deploy the conflict-free backend:"
echo "   ./deploy-conflict-free-backend.sh"
echo

echo "5. Alternative manual deployment:"
echo "   aws cloudformation deploy \\"
echo "     --template-file infra/template-conflict-free.yaml \\"
echo "     --stack-name acta-conflict-free-backend \\"
echo "     --parameter-overrides \\"
echo "       ExistingApiId=q2b9avfwv5 \\"
echo "       ExistingApiRootResourceId=kw8f8zihjg \\"
echo "     --capabilities CAPABILITY_IAM \\"
echo "     --region us-east-2"
echo

echo "6. Test the new endpoints after deployment:"
echo "   curl https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/pm-manager/all-projects"
echo "   curl https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health"
echo

echo "✅ Ready to deploy! Run these commands on your Mac."
