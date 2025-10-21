# Cron Job Monitoring Guide

## 🎯 Overview

Your Kaiwa cron jobs now have **automatic monitoring and notifications**. Every time a cron job runs and sends emails, you'll receive a summary email.

---

## 📧 Automatic Email Notifications

After each successful cron run, you'll receive an email at **hiro@trykaiwa.com** with:

- ✅ Number of emails sent
- ⏭️ Number of users skipped (rate limited)
- ❌ Number of failures (if any)
- 👥 Total eligible users
- 📊 Breakdown by user segments (new users, inactive, dormant, etc.)
- 🧪 Test mode indicator (if using `testEmails` parameter)

**Email subject**: `✅ Daily Reminders Sent - X emails`

---

## 🔍 Manual Health Checks

### Option 1: Run Health Check Script

```bash
chmod +x scripts/check-cron-health.sh
./scripts/check-cron-health.sh
```

This script will show you:
- All scheduled cron machines on Fly.io
- Recent cron execution logs
- Machine status and details
- Current UTC time vs scheduled times

### Option 2: Check Fly.io Logs

```bash
# View all recent logs
fly logs --app kaiwa

# Filter for cron-related logs only
fly logs --app kaiwa | grep -i "cron\|reminder"

# Watch logs in real-time
fly logs --app kaiwa --tail
```

### Option 3: List Cron Machines

```bash
# List all machines
fly machines list --app kaiwa

# Filter for cron machines only
fly machines list --app kaiwa | grep cron

# Get detailed status of a specific machine
fly machine status <machine-id> --app kaiwa
```

---

## 🧪 Testing Cron Jobs

### Test with Dry Run (no emails sent)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://trykaiwa.com/api/cron/send-reminders?dryRun=true"
```

### Test with Your Emails Only

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://trykaiwa.com/api/cron/send-reminders?testEmails=hkuwana97@gmail.com,weijo34@gmail.com"
```

**Note**: Test mode also sends you a summary email!

### Run the Script

```bash
chmod +x send-test-emails.sh
./send-test-emails.sh
```

---

## ⏰ Cron Schedule

Your cron jobs are scheduled to run at:

- **Daily Reminders**: 9:00 AM UTC
- **Founder Emails**: 2:00 PM UTC
- **Weekly Digest**: 10:00 AM UTC (Mondays only)

### Convert to Your Local Time

```bash
# Current UTC time
date -u

# Convert 9:00 AM UTC to your timezone (example: PST)
# 9:00 AM UTC = 1:00 AM PST (UTC-8)
# 9:00 AM UTC = 2:00 AM PDT (UTC-7)
```

---

## 🚨 What to Watch For

### Signs Everything is Working ✅

1. You receive a summary email every day at ~9:00 AM UTC
2. Logs show successful cron executions
3. Email stats look reasonable (sent > 0, failed = 0)
4. Users report receiving reminder emails

### Signs Something Might Be Wrong ⚠️

1. **No summary email received**
   - Check: `fly logs --app kaiwa | grep "send-reminders"`
   - Fix: Ensure cron machines are deployed (`./scripts/deploy-cron-jobs.sh`)

2. **Summary email shows 0 sent**
   - Check: Are all users being rate-limited (skipped > 0)?
   - Check: Run dry run to see eligible users

3. **Summary email shows failures**
   - Check logs for error details
   - Verify RESEND_API_KEY is configured correctly

4. **Cron machines not listed**
   - Run: `fly machines list --app kaiwa | grep cron`
   - Fix: Deploy cron machines (`./scripts/deploy-cron-jobs.sh`)

---

## 🛠️ Common Commands

```bash
# Check if cron machines exist
fly machines list --app kaiwa | grep cron

# View recent cron logs
fly logs --app kaiwa | grep -i cron | tail -50

# Test the endpoint (dry run)
curl -H "Authorization: Bearer ymTO1zoqAW8FMQKjyJU165EPG4vtJNwNFEelpRkQGJw=" \
  "https://trykaiwa.com/api/cron/send-reminders?dryRun=true"

# Deploy or update cron machines
./scripts/deploy-cron-jobs.sh

# Check health
./scripts/check-cron-health.sh
```

---

## 📝 Logs to Look For

**Successful execution:**
```
🔍 Cron endpoint called - send-reminders
✅ Authorized, dryRun: false
📊 Found 73 eligible user IDs
👥 Found 73 users to process
✅ Processing complete! Sent: 73, Skipped: 0, Failed: 0
📧 Cron summary email sent to admin
```

**Rate limiting (expected if run multiple times):**
```
✅ Processing complete! Sent: 0, Skipped: 73, Failed: 0
```

**Errors (need attention):**
```
❌ Error sending reminder to user@example.com
Failed to send cron summary email
```

---

## 🎯 Next Steps

1. **Deploy the updated code:**
   ```bash
   fly deploy --app kaiwa
   ```

2. **Test with your emails:**
   ```bash
   ./send-test-emails.sh
   ```

3. **Check your inbox** (hiro@trykaiwa.com) for:
   - The reminder email (if you're eligible)
   - The summary notification email

4. **If tests look good, deploy automated cron:**
   ```bash
   ./scripts/deploy-cron-jobs.sh
   ```

5. **Monitor tomorrow at 9:00 AM UTC** - you should receive a summary email!

---

## 💡 Tips

- **Summary emails only send when emails are actually sent** (not in dry run mode)
- **Test mode is indicated** in the summary email with a yellow banner
- **Failed emails won't fail the entire cron job** - you'll just get notified
- **Logs are your friend** - check them first if something seems off
- **Time zones matter** - all schedules are in UTC
