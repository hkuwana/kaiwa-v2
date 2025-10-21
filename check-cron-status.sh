#!/bin/bash

echo "🔍 Checking Kaiwa Cron Job Status"
echo "=================================="
echo ""

echo "📋 Step 1: List all machines"
echo "----------------------------"
fly machines list --app kaiwa 2>&1 | grep -E "(ID|cron)" || echo "No cron machines found or auth issue"

echo ""
echo "📊 Step 2: Check recent logs for cron activity"
echo "----------------------------------------------"
fly logs --app kaiwa 2>&1 | grep -i "cron\|reminder" | tail -20 || echo "No recent cron logs or auth issue"

echo ""
echo "🎯 Step 3: What time is it now?"
echo "-------------------------------"
echo "Current UTC time: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "Your cron is scheduled for: 9:00 AM UTC daily"

echo ""
echo "💡 Next Steps:"
echo "-------------"
echo "1. If no cron machines exist, deploy them:"
echo "   ./scripts/deploy-cron-jobs.sh"
echo ""
echo "2. If machines exist, manually trigger a test:"
echo "   fly machine run --app kaiwa \\"
echo "     --entrypoint pnpm --cmd tsx --cmd scripts/send-reminders.ts"
echo ""
echo "3. Or test via API endpoint:"
echo "   curl -H \"Authorization: Bearer \$CRON_SECRET\" \\"
echo "     \"https://trykaiwa.com/api/cron/send-reminders\""
