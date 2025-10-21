#!/bin/bash

echo "📧 Sending TEST reminder emails to your accounts only"
echo "====================================================="
echo ""
echo "Test emails will be sent to:"
echo "  - hkuwana97@gmail.com"
echo "  - weijo34@gmail.com"
echo ""
echo "⚠️  This will send REAL emails (not a dry run)"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "🚀 Sending test emails..."

RESPONSE=$(curl -s \
  -H "Authorization: Bearer ymTO1zoqAW8FMQKjyJU165EPG4vtJNwNFEelpRkQGJw=" \
  "https://trykaiwa.com/api/cron/send-reminders?testEmails=hkuwana97@gmail.com,weijo34@gmail.com")

echo ""
echo "📊 Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Done! Check your inboxes:"
echo "   - hkuwana97@gmail.com"
echo "   - weijo34@gmail.com"
echo ""
echo "If emails look good, you can:"
echo "1. Send to all users: curl -H \"Authorization: Bearer \$CRON_SECRET\" \"https://trykaiwa.com/api/cron/send-reminders\""
echo "2. Deploy automated daily cron: ./scripts/deploy-cron-jobs.sh"
