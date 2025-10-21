#!/bin/bash

###############################################################################
# Cron Jobs Diagnostic Script
#
# This script checks the status of your cron jobs and provides actionable
# next steps.
#
# Usage:
#   ./scripts/diagnose-cron.sh
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

echo -e "${BOLD}🔍 Cron Jobs Diagnostic Tool${NC}\n"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

###############################################################################
# Check 1: Fly CLI installed
###############################################################################

echo -e "${BLUE}1. Checking Fly CLI...${NC}"
if command -v fly &> /dev/null; then
    FLY_VERSION=$(fly version)
    echo -e "${GREEN}   ✅ Fly CLI installed: ${FLY_VERSION}${NC}"
else
    echo -e "${RED}   ❌ Fly CLI not installed${NC}"
    echo -e "${YELLOW}   👉 Install: https://fly.io/docs/hands-on/install-flyctl/${NC}"
    exit 1
fi
echo ""

###############################################################################
# Check 2: Fly authentication
###############################################################################

echo -e "${BLUE}2. Checking Fly authentication...${NC}"
if fly auth whoami &> /dev/null; then
    FLY_USER=$(fly auth whoami)
    echo -e "${GREEN}   ✅ Authenticated as: ${FLY_USER}${NC}"
else
    echo -e "${RED}   ❌ Not authenticated${NC}"
    echo -e "${YELLOW}   👉 Run: fly auth login${NC}"
    exit 1
fi
echo ""

###############################################################################
# Check 3: Fly apps
###############################################################################

echo -e "${BLUE}3. Checking Fly apps...${NC}"
FLY_APPS=$(fly apps list 2>&1)

if echo "$FLY_APPS" | grep -q "kaiwa"; then
    echo -e "${GREEN}   ✅ App 'kaiwa' found${NC}"
    APP_EXISTS=true
else
    echo -e "${YELLOW}   ⚠️  App 'kaiwa' not found${NC}"
    echo ""
    echo -e "${BOLD}   Your Fly apps:${NC}"
    echo "$FLY_APPS" | grep -v "^NAME" | head -5
    echo ""
    echo -e "${YELLOW}   👉 The app might be named differently, or you may need to create it${NC}"
    echo -e "${YELLOW}   👉 To create: fly launch --no-deploy${NC}"
    APP_EXISTS=false
fi
echo ""

###############################################################################
# Check 4: Fly machines (if app exists)
###############################################################################

if [ "$APP_EXISTS" = true ]; then
    echo -e "${BLUE}4. Checking Fly machines...${NC}"

    if fly machines list --app kaiwa &> /dev/null; then
        MACHINES=$(fly machines list --app kaiwa 2>&1)
        echo "$MACHINES"
        echo ""

        if echo "$MACHINES" | grep -q "cron-daily-reminders"; then
            echo -e "${GREEN}   ✅ cron-daily-reminders machine found${NC}"
        else
            echo -e "${YELLOW}   ⚠️  cron-daily-reminders machine NOT found${NC}"
            echo -e "${YELLOW}   👉 Run: pnpm cron:deploy${NC}"
        fi

        if echo "$MACHINES" | grep -q "cron-founder-emails"; then
            echo -e "${GREEN}   ✅ cron-founder-emails machine found${NC}"
        else
            echo -e "${YELLOW}   ⚠️  cron-founder-emails machine NOT found${NC}"
            echo -e "${YELLOW}   👉 Run: pnpm cron:deploy${NC}"
        fi

        if echo "$MACHINES" | grep -q "cron-weekly-digest"; then
            echo -e "${GREEN}   ✅ cron-weekly-digest machine found${NC}"
        else
            echo -e "${YELLOW}   ⚠️  cron-weekly-digest machine NOT found${NC}"
            echo -e "${YELLOW}   👉 Run: pnpm cron:deploy${NC}"
        fi
    else
        echo -e "${YELLOW}   ⚠️  Cannot access machines (app might not be deployed)${NC}"
        echo -e "${YELLOW}   👉 Run: fly deploy${NC}"
    fi
    echo ""
fi

###############################################################################
# Check 5: Fly secrets (if app exists)
###############################################################################

if [ "$APP_EXISTS" = true ]; then
    echo -e "${BLUE}5. Checking Fly secrets...${NC}"

    if fly secrets list --app kaiwa &> /dev/null; then
        SECRETS=$(fly secrets list --app kaiwa 2>&1)

        if echo "$SECRETS" | grep -q "CRON_SECRET"; then
            echo -e "${GREEN}   ✅ CRON_SECRET set${NC}"
        else
            echo -e "${RED}   ❌ CRON_SECRET not set${NC}"
            echo -e "${YELLOW}   👉 Run: fly secrets set CRON_SECRET=\$(openssl rand -hex 32)${NC}"
        fi

        if echo "$SECRETS" | grep -q "RESEND_API_KEY"; then
            echo -e "${GREEN}   ✅ RESEND_API_KEY set${NC}"
        else
            echo -e "${RED}   ❌ RESEND_API_KEY not set${NC}"
            echo -e "${YELLOW}   👉 Run: fly secrets set RESEND_API_KEY=your_key${NC}"
        fi

        if echo "$SECRETS" | grep -q "DATABASE_URL"; then
            echo -e "${GREEN}   ✅ DATABASE_URL set${NC}"
        else
            echo -e "${RED}   ❌ DATABASE_URL not set${NC}"
            echo -e "${YELLOW}   👉 Run: fly secrets set DATABASE_URL=your_url${NC}"
        fi
    else
        echo -e "${YELLOW}   ⚠️  Cannot check secrets (app might not be deployed)${NC}"
    fi
    echo ""
fi

###############################################################################
# Check 6: Recent logs (if app exists)
###############################################################################

if [ "$APP_EXISTS" = true ]; then
    echo -e "${BLUE}6. Checking recent cron logs...${NC}"

    if fly logs --app kaiwa &> /dev/null; then
        CRON_LOGS=$(fly logs --app kaiwa 2>&1 | grep -E "(cron|reminders|founder)" | tail -10)

        if [ -z "$CRON_LOGS" ]; then
            echo -e "${YELLOW}   ⚠️  No cron logs found${NC}"
            echo -e "${YELLOW}   Possible reasons:${NC}"
            echo -e "${YELLOW}   - Cron jobs haven't run yet (check schedule)${NC}"
            echo -e "${YELLOW}   - Cron machines not deployed${NC}"
            echo -e "${YELLOW}   - Logs rotated out (>24 hours old)${NC}"
        else
            echo -e "${GREEN}   ✅ Found recent cron logs:${NC}"
            echo "$CRON_LOGS"
        fi
    else
        echo -e "${YELLOW}   ⚠️  Cannot access logs${NC}"
    fi
    echo ""
fi

###############################################################################
# Check 7: Local scripts
###############################################################################

echo -e "${BLUE}7. Checking local scripts...${NC}"

if [ -f "scripts/send-reminders.ts" ]; then
    echo -e "${GREEN}   ✅ scripts/send-reminders.ts exists${NC}"
else
    echo -e "${RED}   ❌ scripts/send-reminders.ts missing${NC}"
fi

if [ -f "scripts/send-founder-emails.ts" ]; then
    echo -e "${GREEN}   ✅ scripts/send-founder-emails.ts exists${NC}"
else
    echo -e "${RED}   ❌ scripts/send-founder-emails.ts missing${NC}"
fi

if [ -f "scripts/send-weekly-digest.ts" ]; then
    echo -e "${GREEN}   ✅ scripts/send-weekly-digest.ts exists${NC}"
else
    echo -e "${RED}   ❌ scripts/send-weekly-digest.ts missing${NC}"
fi

if [ -f "scripts/deploy-cron-jobs.sh" ]; then
    echo -e "${GREEN}   ✅ scripts/deploy-cron-jobs.sh exists${NC}"

    if [ -x "scripts/deploy-cron-jobs.sh" ]; then
        echo -e "${GREEN}   ✅ deploy-cron-jobs.sh is executable${NC}"
    else
        echo -e "${YELLOW}   ⚠️  deploy-cron-jobs.sh is not executable${NC}"
        echo -e "${YELLOW}   👉 Run: chmod +x scripts/deploy-cron-jobs.sh${NC}"
    fi
else
    echo -e "${RED}   ❌ scripts/deploy-cron-jobs.sh missing${NC}"
fi
echo ""

###############################################################################
# Summary & Next Steps
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BOLD}📋 Summary & Next Steps${NC}\n"

if [ "$APP_EXISTS" = false ]; then
    echo -e "${BOLD}${RED}🚨 PRIMARY ISSUE: Fly.io app 'kaiwa' does not exist${NC}\n"
    echo -e "${BOLD}Next Steps:${NC}"
    echo -e "1. Create the app:      ${YELLOW}fly launch --no-deploy${NC}"
    echo -e "2. Set secrets:         ${YELLOW}fly secrets set CRON_SECRET=\$(openssl rand -hex 32)${NC}"
    echo -e "                        ${YELLOW}fly secrets set RESEND_API_KEY=your_key${NC}"
    echo -e "                        ${YELLOW}fly secrets set DATABASE_URL=your_url${NC}"
    echo -e "3. Deploy main app:     ${YELLOW}fly deploy${NC}"
    echo -e "4. Deploy cron jobs:    ${YELLOW}pnpm cron:deploy${NC}"
    echo -e "5. Verify deployment:   ${YELLOW}fly machines list${NC}"
else
    echo -e "${GREEN}✅ Fly.io app exists!${NC}\n"
    echo -e "${BOLD}Next Steps:${NC}"
    echo -e "1. Verify secrets are set:  ${YELLOW}fly secrets list${NC}"
    echo -e "2. Deploy main app:         ${YELLOW}fly deploy${NC}"
    echo -e "3. Deploy cron jobs:        ${YELLOW}pnpm cron:deploy${NC}"
    echo -e "4. Verify machines:         ${YELLOW}fly machines list${NC}"
    echo -e "5. Monitor logs:            ${YELLOW}fly logs -f${NC}"
fi

echo ""
echo -e "${BOLD}📚 Documentation:${NC}"
echo -e "   - Read: ${BLUE}CRON_DEBUGGING_GUIDE.md${NC}"
echo -e "   - Read: ${BLUE}CRON_SETUP_SUMMARY.md${NC}"
echo -e "   - Read: ${BLUE}src/lib/docs/architecture-cron-jobs.md${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
