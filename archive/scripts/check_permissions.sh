#!/bin/bash
echo "🔍 Test 2 – Lambda-invoke permissions present"
REQ_PERMS=(
  PMManagerAllProjectsPermission
  PMManagerByEmailPermission
  ProjectsManagerPermission
  DocumentValidatorGetPermission
  DocumentValidatorHeadPermission
  ProjectMetadataEnricherPermission
  ProjectsAliasPermission
  PMProjectsAllAliasPermission
  PMProjectsByEmailAliasPermission
  CheckDocGetAliasPermission
  CheckDocHeadAliasPermission
)

missing=0
for p in "${REQ_PERMS[@]}"; do
  if grep -q "^  $p:" infra/template-conflict-free.yaml; then
    echo "  ✓ $p"
  else
    echo "  ❌ Missing $p"; missing=1
  fi
done

if [[ $missing -eq 0 ]]; then
  echo "✅ All permissions declared"
else
  echo "❌ Permission list incomplete"
  exit 1
fi
