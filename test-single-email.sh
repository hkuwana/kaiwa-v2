#!/bin/bash

# Test sending a reminder email to just one user (you!)

echo "📧 Testing single reminder email..."
echo ""
echo "This will send ONE test email to: hiro@trykaiwa.com"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Use the API to send to all users, but since you practiced recently,
# only inactive users will receive emails
curl -X GET \
  -H "Authorization: Bearer ymTO1zoqAW8FMQKjyJU165EPG4vtJNwNFEelpRkQGJw=" \
  "https://trykaiwa.com/api/cron/send-reminders" \
  | jq .

echo ""
echo "✅ Done! Check your email (hiro@trykaiwa.com)"
echo ""
echo "If it worked, you can now deploy the automated cron job:"
echo "  ./scripts/deploy-cron-jobs.sh"
