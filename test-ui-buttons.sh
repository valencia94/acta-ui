#!/usr/bin/env bash

# test-ui-buttons.sh - Test all UI buttons in the ACTA-UI application

set -euo pipefail

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}ACTA-UI Button Testing Script${NC}"
echo -e "${BLUE}==============================================${NC}"

# Check if the application is running
echo -e "\n${YELLOW}Step 1: Checking if the application is deployed...${NC}"
curl -s -o /dev/null -w "%{http_code}" "https://d7t9x3j66yd8k.cloudfront.net/" | grep -q "200"
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Application not accessible. Please deploy it first.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Application is accessible${NC}"

# Run the button functionality test
echo -e "\n${YELLOW}Step 2: Running the button functionality test...${NC}"
echo -e "${YELLOW}Opening browser with the button test runner...${NC}"

# Determine the operating system and open the browser
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open "https://d7t9x3j66yd8k.cloudfront.net/?test=buttons"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open "https://d7t9x3j66yd8k.cloudfront.net/?test=buttons"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  # Windows
  start "https://d7t9x3j66yd8k.cloudfront.net/?test=buttons"
else
  echo -e "${YELLOW}Please manually open this URL:${NC}"
  echo -e "https://d7t9x3j66yd8k.cloudfront.net/?test=buttons"
fi

echo -e "${GREEN}✅ Browser opened with the button test runner${NC}"

# Explain how to run the tests
echo -e "\n${YELLOW}To run the tests:${NC}"
echo -e "1. Sign in with your credentials"
echo -e "2. Open the browser developer console (F12)"
echo -e "3. Run one of these commands to test buttons:"
echo -e "   ${BLUE}- runButtonTests()${NC} - Tests all button functionality"
echo -e "   ${BLUE}- runNavigationTests()${NC} - Tests navigation buttons"
echo -e "   ${BLUE}- runProductionValidation()${NC} - Runs full production validation"
echo -e "   ${BLUE}- runAuthApiTest()${NC} - Tests authentication and API calls"

echo -e "\n${GREEN}Button testing instructions displayed${NC}"
echo -e "${BLUE}==============================================${NC}"

# Add a reminder about the debug panel
echo -e "\n${YELLOW}💡 Remember:${NC} You can use the 'Show Debug Info' option on the login page to check authentication configuration"
