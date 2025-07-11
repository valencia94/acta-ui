#!/usr/bin/env bash
# Run end-to-end button test

set -euo pipefail

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}ACTA-UI Button End-to-End Test${NC}"
echo -e "${BLUE}==============================================${NC}"

echo -e "\n${YELLOW}Running button test using browser interface...${NC}"
echo -e "${YELLOW}This will test all buttons with proper authentication${NC}"

# Start a simple HTTP server to serve the test runner
echo -e "\n${YELLOW}Starting local server to run the button tests...${NC}"

# Determine port - try 8000 first, but use a fallback if it's in use
PORT=8000
while nc -z localhost $PORT 2>/dev/null; do
  echo -e "${YELLOW}Port $PORT is in use, trying next port...${NC}"
  PORT=$((PORT + 1))
done

echo -e "${GREEN}✅ Using port $PORT for the test server${NC}"

# Start the server in the background
echo -e "${YELLOW}Starting HTTP server on http://localhost:$PORT/${NC}"
(python3 -m http.server $PORT || python -m SimpleHTTPServer $PORT) &
SERVER_PID=$!

# Give the server a moment to start
sleep 1

# Open the test runner in the browser
echo -e "${YELLOW}Opening button test runner in browser...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:$PORT/button-test-runner.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  xdg-open "http://localhost:$PORT/button-test-runner.html"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  start "http://localhost:$PORT/button-test-runner.html"
else
  echo -e "${YELLOW}Please open this URL in your browser:${NC} http://localhost:$PORT/button-test-runner.html"
fi

echo -e "${GREEN}✅ Button test runner started!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server when you're done testing${NC}"
echo -e "\n${BLUE}Test Instructions:${NC}"
echo -e "1. Click on 'Run Button Functionality Test' to test all UI buttons"
echo -e "2. Click on 'Run Navigation Button Test' to test navigation"
echo -e "3. Click on 'Run Production Readiness Test' for a full system validation"
echo -e "4. Click on 'Run Auth & API Test' to test authentication and API integrations"

# Wait for user to press Ctrl+C
trap "echo -e '\n${GREEN}Stopping server...${NC}'; kill $SERVER_PID 2>/dev/null || true; exit 0" INT
wait $SERVER_PID
