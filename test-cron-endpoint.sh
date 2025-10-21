#!/bin/bash

# Test the cron endpoint and show detailed results

echo "🔍 Testing send-reminders endpoint..."
echo ""

RESPONSE=$(curl -s \
  -H "Authorization: Bearer ymTO1zoqAW8FMQKjyJU165EPG4vtJNwNFEelpRkQGJw=" \
  "https://trykaiwa.com/api/cron/send-reminders?dryRun=true")

echo "📊 Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

echo ""
echo "🔍 Key Stats:"
echo "$RESPONSE" | jq -r '.stats | "Total Users: \(.total)\nSent: \(.sent)\nSkipped: \(.skipped)\nFailed: \(.failed)"' 2>/dev/null || echo "Could not parse stats"

echo ""
echo "📧 Dry Run Previews (first 3):"
echo "$RESPONSE" | jq -r '.stats.dryRunPreviews[:3]' 2>/dev/null || echo "No previews found"

echo ""
echo "👥 Segments:"
echo "$RESPONSE" | jq -r '.stats.segments' 2>/dev/null || echo "No segments found"
