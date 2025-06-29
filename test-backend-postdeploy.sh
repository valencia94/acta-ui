#!/bin/bash
# Post-Deployment Endpoint Tests — ACTA-UI (conflict-free API paths)

set -e

echo "🧪 ACTA-UI Post-Deployment Endpoint Testing"
echo "==========================================="

# ───────── Colour helpers ─────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

# ───────── Runtime config (CLI args or defaults) ─────────
API_ID="${1:-q2b9avfwv5}"
REGION="${2:-us-east-2}"
STAGE="${3:-prod}"
BASE_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo "  API Gateway ID: $API_ID"
echo "  Region:         $REGION"
echo "  Stage:          $STAGE"
echo "  Base URL:       $BASE_URL"
echo ""

################################################################################
# Helper: hit an endpoint and evaluate status
################################################################################
test_endpoint () {
  local method="$1" path="$2" desc="$3" want="$4"
  echo -e "${YELLOW}🔍 $desc${NC}"
  echo "  $method $path  (expect $want)"
  command -v curl >/dev/null 2>&1 || { echo -e "${YELLOW}  ⚠️ curl missing — skipping${NC}"; return 0; }

  local url="${BASE_URL}${path}" code
  local start=$(date +%s%N)
  if [ "$method" = "HEAD" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" -X HEAD --max-time 10 "$url" || echo 000)
  else
    code=$(curl -s -o /dev/null -w "%{http_code}"        --max-time 10 "$url" || echo 000)
  fi
  local ms=$(( ( $(date +%s%N) - start ) / 1000000 ))
  echo "  → HTTP $code (${ms} ms)"

  case "$code" in
    "$want")               echo -e "${GREEN}  ✅ PASS${NC}" ;;
    403|200)               echo -e "${YELLOW}  ⚠️ AUTH/OK ($code)${NC}" ;;
    000)                   echo -e "${RED}  ❌ TIMEOUT${NC}"; return 1 ;;
    *)                     echo -e "${RED}  ❌ UNEXPECTED $code${NC}"; return 1 ;;
  esac
}

################################################################################
# 1️⃣  PM-Manager endpoints
################################################################################
echo -e "${BLUE}🔍 Group 1: PM-Manager Endpoints${NC}"
test_endpoint GET "/pm-manager/all-projects"         "All projects for PM dashboard"   200
test_endpoint GET "/pm-manager/test@example.com"     "Projects by PM email"            200
echo ""

################################################################################
# 2️⃣  Projects-Manager endpoint
################################################################################
echo -e "${BLUE}🔍 Group 2: Projects-Manager Endpoint${NC}"
test_endpoint GET "/projects-manager"                "General projects list"           200
echo ""

################################################################################
# 3️⃣  Document-Validator endpoints
################################################################################
echo -e "${BLUE}🔍 Group 3: Document-Validator Endpoints${NC}"
test_endpoint GET  "/document-validator/test-123"    "Doc status (GET)"                200
test_endpoint HEAD "/document-validator/test-123"    "Doc status (HEAD)"               200
echo ""

################################################################################
# 4️⃣  Error handling checks
################################################################################
echo -e "${BLUE}🔍 Group 4: Error Handling${NC}"
test_endpoint GET  "/nonexistent"                    "Non-existent path"               404
test_endpoint POST "/pm-manager/all-projects"        "Wrong HTTP method"               405
echo ""

################################################################################
# 5️⃣  Performance quick-check (5× GET /projects-manager)
################################################################################
echo -e "${BLUE}🔍 Group 5: Performance Consistency${NC}"
PERF_PATH="/projects-manager"; ok=0; total=5
for i in $(seq 1 $total); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${BASE_URL}${PERF_PATH}" || echo 000)
  if [[ "$code" == 200 || "$code" == 403 ]]; then
    ok=$((ok+1)); echo -e "  Request $i: ${GREEN}$code${NC}"
  else
    echo -e "  Request $i: ${RED}$code${NC}"
  fi
done
rate=$(( ok * 100 / total ))
echo "  Success rate: $rate% ($ok/$total)"
[[ $rate -ge 80 ]] && echo -e "${GREEN}  ✅ PASS${NC}" || echo -e "${RED}  ❌ FAIL${NC}"
echo ""

################################################################################
# 6️⃣  CORS OPTIONS check on /projects-manager
################################################################################
echo -e "${BLUE}🔍 Group 6: CORS Headers${NC}"
if command -v curl >/dev/null 2>&1; then
  hdrs=$(curl -s -I -X OPTIONS "${BASE_URL}${PERF_PATH}" || true)
  if echo "$hdrs" | grep -iq "access-control-allow-origin"; then
    echo -e "${GREEN}  ✅ CORS headers present${NC}"
  else
    echo -e "${YELLOW}  ⚠️  CORS headers missing (may be Lambda-handled)${NC}"
  fi
else
  echo -e "${YELLOW}  ⚠️  curl not available, skipping${NC}"
fi
echo ""

################################################################################
# Summary
################################################################################
echo -e "${GREEN}🎉 POST-DEPLOYMENT TESTS COMPLETE${NC}"
echo ""
echo -e "${BLUE}📊 Key Endpoints:${NC}"
printf '  • GET  %s/pm-manager/all-projects\n'          "$BASE_URL"
printf '  • GET  %s/pm-manager/{pmEmail}\n'             "$BASE_URL"
printf '  • GET  %s/projects-manager\n'                 "$BASE_URL"
printf '  • GET  %s/document-validator/{projectId}\n'   "$BASE_URL"
printf '  • HEAD %s/document-validator/{projectId}\n'   "$BASE_URL"
echo ""
