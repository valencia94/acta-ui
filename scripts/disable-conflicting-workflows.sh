#!/bin/bash
# Disable conflicting GitHub Actions workflows

echo "🧹 Disabling conflicting GitHub Actions workflows..."
echo "Keeping only: deploy-production.yml (our main workflow)"

# List of workflows to disable (keep only deploy-production.yml)
WORKFLOWS_TO_DISABLE=(
  "bulletproof-deploy.yml"
  "deploy-github-pages.yml" 
  "deploy-backend.yml"
  "deploy-lambda-fixes.yml"
  "smoke-prod.yml"
  "apply_oac_policy.yml"
  "check-cloudfront-status.yml"
  "dependencies-update.yml"
)

for workflow in "${WORKFLOWS_TO_DISABLE[@]}"; do
  workflow_path=".github/workflows/${workflow}"
  
  if [ -f "$workflow_path" ]; then
    echo "📝 Disabling ${workflow}..."
    
    # Add DISABLED to name and remove triggers
    sed -i.bak '1s/name: /name: [DISABLED] /' "$workflow_path"
    
    # Comment out push/schedule triggers while preserving workflow_dispatch
    sed -i.bak '/^on:/,/^[[:space:]]*workflow_dispatch/ {
      /^[[:space:]]*push:/,/^[[:space:]]*branches:/ {
        /^[[:space:]]*push:/s/^/# /
        /^[[:space:]]*branches:/s/^/# /
      }
      /^[[:space:]]*schedule:/,/^[[:space:]]*-/ {
        s/^/# /
      }
      /^[[:space:]]*workflow_run:/,/^[[:space:]]*types:/ {
        s/^/# /
      }
    }' "$workflow_path"
    
    # Remove backup file
    rm -f "${workflow_path}.bak"
    
    echo "✅ Disabled ${workflow}"
  else
    echo "⚠️ ${workflow} not found"
  fi
done

echo ""
echo "🎯 Active workflows:"
echo "✅ deploy-production.yml (ONLY active workflow)"
echo ""
echo "🚫 Disabled workflows:"
for workflow in "${WORKFLOWS_TO_DISABLE[@]}"; do
  echo "   ❌ ${workflow}"
done
echo ""
echo "✅ Workflow cleanup complete!"
