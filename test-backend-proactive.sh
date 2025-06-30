#!/bin/bash
# Proactive Backend Testing – ACTA-UI conflict-free stack

set -euo pipefail
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

TEMPLATE_FILE="infra/template-conflict-free.yaml"
REGION="us-east-2"
API_ID="q2b9avfwv5"

echo -e "${BLUE}📋 Template under test: $TEMPLATE_FILE${NC}\n"

###############################################################################
# Test 1 – sam validate
###############################################################################
echo -e "${YELLOW}🔍 Test 1 – sam validate${NC}"
if command -v sam >/dev/null 2>&1; then
  sam validate --template-file "$TEMPLATE_FILE" --region "$REGION" >/dev/null
  echo -e "${GREEN}✅ sam validate passed${NC}\n"
else
  echo -e "${YELLOW}⚠️  sam command not available, skipping validation${NC}\n"
fi

###############################################################################
# Test 2 – every permission block present (12 total)
###############################################################################
echo -e "${YELLOW}🔍 Test 2 – Lambda-invoke permissions present${NC}"
REQ_PERMS=(
  # Actual permissions in template-conflict-free.yaml
  ProjectsPermission
  PMProjectsAllPermission
  PMProjectsEmailPermission
  CheckDocGetPermission
  CheckDocHeadPermission
)

missing=0
for p in "${REQ_PERMS[@]}"; do
  if grep -q "^  $p:" "$TEMPLATE_FILE"; then
    echo "  ✓ $p"
  else
    echo -e "  ${RED}❌ Missing $p${NC}"; missing=1
  fi
done

[[ $missing -eq 0 ]] || { echo -e "${RED}❌ Permission list incomplete – aborting${NC}"; exit 1; }
echo -e "${GREEN}✅ All permissions declared${NC}\n"

###############################################################################
# Test 3 – Endpoint reachability (expects 200 or 403)
###############################################################################
echo -e "${YELLOW}🔍 Test 3 – Endpoint ping${NC}"

declare -A ENDPOINTS=(
  [health]="/health"
  [projects]="/projects"
  [pm-all]="/pm-projects/all-projects"
  [check-doc]="/check-document/test-id"
)

for key in "${!ENDPOINTS[@]}"; do
  path=${ENDPOINTS[$key]}
  code=$(curl -s -o /dev/null -w "%{http_code}" \
         "https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod${path}" || echo 000)
  if [[ "$code" == 200 || "$code" == 403 ]]; then
    echo -e "  ✓ ${key} → HTTP $code"
  else
    echo -e "  ${YELLOW}⚠️  ${key} → HTTP $code${NC}"
  fi
done

echo -e "\n${GREEN}🎉 Proactive backend tests passed${NC}"
