#!/bin/bash

###############################################################################
# Remote Cron Job Testing Script
#
# This script tests your cron jobs via the HTTP endpoints that are already
# deployed on your production app.
#
# Usage:
#   CRON_SECRET=your_secret ./scripts/test-cron-remote.sh
#
# Environment Variables:
#   CRON_SECRET   - Your cron secret (required)
#   BASE_URL      - Base URL of your app (default: https://trykaiwa.com)
#
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-https://trykaiwa.com}"

echo -e "${BOLD}🧪 Remote Cron Job Testing${NC}\n"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

###############################################################################
# Check prerequisites
###############################################################################

if [ -z "$CRON_SECRET" ]; then
    echo -e "${RED}❌ CRON_SECRET environment variable not set${NC}"
    echo ""
    echo -e "${YELLOW}Set it with:${NC}"
    echo -e "  export CRON_SECRET=your_secret_here"
    echo ""
    echo -e "${YELLOW}Or run this script with:${NC}"
    echo -e "  CRON_SECRET=your_secret ./scripts/test-cron-remote.sh"
    echo ""
    echo -e "${YELLOW}💡 Get your CRON_SECRET from:${NC}"
    echo -e "  1. Fly.io dashboard secrets"
    echo -e "  2. Or run: fly secrets list --app kaiwa"
    echo ""
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl not installed${NC}"
    exit 1
fi

echo -e "${BLUE}🌐 Testing against: ${BASE_URL}${NC}"
echo -e "${GREEN}🔐 Using CRON_SECRET: ${CRON_SECRET:0:8}...${NC}"
echo ""

###############################################################################
# Test Daily Reminders Endpoint
###############################################################################

echo -e "${BOLD}1. Testing Daily Reminders Endpoint${NC}"
echo -e "${BLUE}   Endpoint: ${BASE_URL}/api/cron/send-reminders?dryRun=true${NC}"
echo ""

REMINDERS_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $CRON_SECRET" \
    "${BASE_URL}/api/cron/send-reminders?dryRun=true")

HTTP_CODE=$(echo "$REMINDERS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REMINDERS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}   ✅ Status: 200 OK${NC}"
    echo ""
    echo -e "${BOLD}   Response:${NC}"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
else
    echo -e "${RED}   ❌ Status: $HTTP_CODE${NC}"
    echo ""
    echo -e "${BOLD}   Response:${NC}"
    echo "$RESPONSE_BODY"
    echo ""

    if [ "$HTTP_CODE" = "401" ]; then
        echo -e "${YELLOW}   💡 This means CRON_SECRET is incorrect${NC}"
        echo -e "${YELLOW}   Check your Fly.io secrets: fly secrets list --app kaiwa${NC}"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "${YELLOW}   💡 Could not connect to ${BASE_URL}${NC}"
        echo -e "${YELLOW}   Is the app deployed and running?${NC}"
    fi
    echo ""
fi

###############################################################################
# Test Founder Emails Endpoint
###############################################################################

echo -e "${BOLD}2. Testing Founder Emails Endpoint${NC}"
echo -e "${BLUE}   Endpoint: ${BASE_URL}/api/cron/founder-emails${NC}"
echo ""

FOUNDER_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $CRON_SECRET" \
    "${BASE_URL}/api/cron/founder-emails")

HTTP_CODE=$(echo "$FOUNDER_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$FOUNDER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}   ✅ Status: 200 OK${NC}"
    echo ""
    echo -e "${BOLD}   Response:${NC}"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
else
    echo -e "${RED}   ❌ Status: $HTTP_CODE${NC}"
    echo ""
    echo -e "${BOLD}   Response:${NC}"
    echo "$RESPONSE_BODY"
    echo ""

    if [ "$HTTP_CODE" = "401" ]; then
        echo -e "${YELLOW}   💡 This means CRON_SECRET is incorrect${NC}"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "${YELLOW}   💡 Could not connect to ${BASE_URL}${NC}"
    fi
    echo ""
fi

###############################################################################
# Summary
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BOLD}📋 Summary${NC}\n"

echo -e "${BOLD}What this test does:${NC}"
echo "  - Tests the HTTP endpoints directly"
echo "  - Uses ?dryRun=true for reminders (won't send real emails)"
echo "  - Verifies CRON_SECRET authentication"
echo "  - Shows you what data would be processed"
echo ""

echo -e "${BOLD}Next steps:${NC}"
echo ""
echo -e "${YELLOW}If tests passed (200 OK):${NC}"
echo "  ✅ Your cron job endpoints are working!"
echo "  ✅ Now you need to schedule them to run automatically"
echo ""
echo "  Options to schedule:"
echo "  1. Deploy Fly.io machines:  pnpm cron:deploy"
echo "  2. GitHub Actions:          Set up .github/workflows/cron.yml"
echo "  3. External service:        Use cron-job.org or similar"
echo ""
echo -e "${YELLOW}If tests failed:${NC}"
echo "  1. Check CRON_SECRET:       fly secrets list --app kaiwa"
echo "  2. Check app is running:    Visit ${BASE_URL} in browser"
echo "  3. Check deployment logs:   fly logs --app kaiwa"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
