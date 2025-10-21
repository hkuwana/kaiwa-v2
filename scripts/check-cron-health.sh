#!/bin/bash

###############################################################################
# Check Cron Job Health on Fly.io
#
# This script checks if cron jobs are running and reviews recent execution logs
###############################################################################

set -e

APP_NAME="kaiwa"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 Checking Cron Job Health for ${APP_NAME}${NC}\n"

# 1. List all machines and filter for cron
echo -e "${GREEN}📋 Scheduled Cron Machines:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fly machines list --app "${APP_NAME}" | grep -E "cron|ID" || echo "No cron machines found"

echo -e "\n"

# 2. Check recent logs for cron activity
echo -e "${GREEN}📊 Recent Cron Execution Logs (last 50 lines):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fly logs --app "${APP_NAME}" | grep -i "cron\|reminder\|send-reminders" | tail -50 || echo "No recent cron logs found"

echo -e "\n"

# 3. Show cron machine details
echo -e "${GREEN}🔧 Cron Machine Details:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CRON_MACHINES=$(fly machines list --app "${APP_NAME}" --json 2>/dev/null | jq -r '.[] | select(.name | contains("cron")) | .id' 2>/dev/null || echo "")

if [ -z "$CRON_MACHINES" ]; then
    echo -e "${YELLOW}⚠️  No cron machines found${NC}"
    echo ""
    echo "To deploy cron machines:"
    echo "  ./scripts/deploy-cron-jobs.sh"
else
    for machine_id in $CRON_MACHINES; do
        echo ""
        echo "Machine ID: $machine_id"
        fly machine status "$machine_id" --app "${APP_NAME}" 2>/dev/null || echo "Could not get status"
    done
fi

echo -e "\n"

# 4. Check current UTC time vs scheduled time
echo -e "${GREEN}⏰ Current Time vs Scheduled Time:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Current UTC time: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo ""
echo "Scheduled cron jobs:"
echo "  - Daily reminders: 09:00 UTC"
echo "  - Founder emails:  14:00 UTC"
echo "  - Weekly digest:   10:00 UTC (Mondays)"

echo -e "\n"

# 5. Manual test endpoint
echo -e "${GREEN}🧪 Manual Test Commands:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test the endpoint directly (dry run):"
echo "  curl -H \"Authorization: Bearer \$CRON_SECRET\" \\"
echo "    \"https://trykaiwa.com/api/cron/send-reminders?dryRun=true\""
echo ""
echo "Test with your emails only:"
echo "  curl -H \"Authorization: Bearer \$CRON_SECRET\" \\"
echo "    \"https://trykaiwa.com/api/cron/send-reminders?testEmails=hkuwana97@gmail.com,weijo34@gmail.com\""

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
