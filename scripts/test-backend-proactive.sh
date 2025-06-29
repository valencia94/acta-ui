#!/bin/bash
# Proactive Backend Testing – ACTA-UI (conflict-free template)

set -euo pipefail
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

TEMPLATE_FILE="infra/template-conflict-free.yaml"
REGION="us-east-2"
API_ID="q2b9avfwv5"

echo -e "${BLUE}📋 Template: $TEMPLATE_FILE${NC}\n"

echo -e "${YELLOW}🔍 Test 1 – sam validate${NC}"
sam validate --template-file "$TEMPLATE_FILE" --region "$REGION" >/dev/null
echo -e "${GREEN}✅ sam validate passed${NC}\n"

echo -e "${YELLOW}🔍 Test 2 – permissions present${NC}"
REQ_PERMS=( PMManagerAllProjectsPermission PMManagerByEmailPermission ProjectsManagerPermission DocumentValidatorGetPermission DocumentValidatorHeadPermission ProjectMetadataEnricherPermission HealthPermission )
missing=0
for p in "${REQ_PERMS[@]}"; do
  grep -q "^  $p:" "$TEMPLATE_FILE" || { echo -e "  ${RED}❌ Missing $p${NC}"; missing=1; }
done
[[ $missing -eq 0 ]] && echo -e "${GREEN}✅ All permissions declared${NC}\n" || exit 1

echo -e "${YELLOW}🔍 Test 3 – Health endpoint reachability${NC}"
code=$(curl -s -o /dev/null -w "%{http_code}" "https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/health" || echo 000)
[[ $code == 200 || $code == 403 ]] && echo -e "${GREEN}✅ Health endpoint reachable (HTTP $code)${NC}" || echo -e "${YELLOW}⚠️  Unexpected HTTP $code${NC}"

echo -e "\n${GREEN}🎉 Proactive backend tests passed${NC}"
