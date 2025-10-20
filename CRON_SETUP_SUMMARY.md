# ✅ Cron Job Setup - Summary of Changes

## What Was Done

Your cron jobs have been reorganized using the **industry-standard separated process architecture** with Fly.io scheduled machines.

### Architecture Change

**Before (Not Working)**:
- HTTP endpoints existed (`/api/cron/*`) but nothing was calling them
- No scheduled tasks configured
- Documentation showed multiple conflicting options

**After (Production-Ready)**:
- ✅ Cron jobs run as **separate Fly.io machines** (isolated processes)
- ✅ Clear deployment script: `./scripts/deploy-cron-jobs.sh`
- ✅ Organized file structure with dedicated `scripts/` directory
- ✅ Updated documentation with clear architecture
- ✅ Easy testing: `pnpm cron:reminders` or `pnpm cron:founder-emails`

---

## 📁 Files Created

### New Scripts
1. **`scripts/send-founder-emails.ts`** - Founder email sequence cron job
2. **`scripts/deploy-cron-jobs.sh`** - Deploy script for all cron jobs
3. **`scripts/README.md`** - Quick reference for scripts

### New Documentation
1. **`src/lib/docs/architecture-cron-jobs.md`** - Comprehensive architecture guide
   - Why separate processes vs HTTP endpoints
   - System architecture diagrams
   - Deployment guide
   - Debugging guide
   - Scaling considerations

### Updated Files
1. **`fly.toml`** - Added architecture comments
2. **`package.json`** - Added npm scripts:
   - `pnpm cron:reminders` - Test reminders locally
   - `pnpm cron:founder-emails` - Test founder emails locally
   - `pnpm cron:deploy` - Deploy all cron jobs
3. **`src/lib/docs/feature-email-reminder-setup.md`** - Updated to reflect new architecture

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│ Fly.io App: kaiwa                      │
├─────────────────────────────────────────┤
│                                         │
│  Process 1: "web" (main app)           │
│  ├─ SvelteKit server                   │
│  └─ Serves user traffic                │
│                                         │
│  Process 2: "cron-daily-reminders"     │
│  ├─ Scheduled: 9am UTC daily           │
│  └─ Runs: scripts/send-reminders.ts    │
│                                         │
│  Process 3: "cron-founder-emails"      │
│  ├─ Scheduled: 2pm UTC daily           │
│  └─ Runs: scripts/send-founder-emails  │
│                                         │
└─────────────────────────────────────────┘
```

**Key Benefits**:
- ✅ **Isolation**: Cron failures don't affect main app
- ✅ **Reliability**: Exact timing (not "approximately")
- ✅ **Security**: No public HTTP endpoints to protect
- ✅ **Debugging**: Separate logs per process
- ✅ **Cost**: Free (included in Fly.io tier)

---

## 🚀 How to Deploy

### Step 1: Deploy Main Application (if not already done)

```bash
fly deploy
```

### Step 2: Deploy Cron Jobs

```bash
# Option 1: Using npm script
pnpm cron:deploy

# Option 2: Direct script
./scripts/deploy-cron-jobs.sh
```

This creates two scheduled machines:
1. `cron-daily-reminders` - Runs at 9am UTC daily
2. `cron-founder-emails` - Runs at 2pm UTC daily

### Step 3: Verify

```bash
# List machines (should see 3: web + 2 cron jobs)
fly machines list

# Expected output:
# ID        NAME                   STATE    REGION
# abc123    kaiwa                  started  den
# def456    cron-daily-reminders   stopped  den  (runs on schedule)
# ghi789    cron-founder-emails    stopped  den  (runs on schedule)
```

**Note**: Cron machines show as "stopped" when not actively running. They automatically start at their scheduled time.

---

## 🧪 Testing

### Test Locally (Recommended Before Deploying)

```bash
# Test daily reminders
pnpm cron:reminders

# Test founder emails
pnpm cron:founder-emails
```

### Test via HTTP Endpoint (Alternative)

```bash
# Set your CRON_SECRET
export CRON_SECRET="your_secret_here"

# Test locally
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:5173/api/cron/send-reminders

# Test production
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://trykaiwa.com/api/cron/send-reminders
```

---

## 📊 Monitoring

### View Logs

```bash
# All logs (main app + cron jobs)
fly logs

# Filter by cron jobs only
fly logs | grep "cron-"

# Follow logs in real-time
fly logs -f
```

### Check Cron Job Status

```bash
# List all machines
fly machines list

# View specific machine details
fly machine status <machine-id>
```

### Expected Log Output (When Running)

```
[cron-daily-reminders] 🚀 Starting automated email reminder process...
[cron-daily-reminders] 📊 Found 10 verified users
[cron-daily-reminders] 📧 8 users eligible for reminders
[cron-daily-reminders] ✅ Reminder sent to user@example.com
[cron-daily-reminders] 🎉 Reminder process completed!
[cron-daily-reminders] 📊 Stats: 8 sent, 0 failed

[cron-founder-emails] 🚀 Starting founder email sequence...
[cron-founder-emails] 📊 Found 5 eligible users
[cron-founder-emails] ✅ Day 1 email sent to newuser@example.com
[cron-founder-emails] 🎉 Founder email sequence completed!
[cron-founder-emails] 📊 Stats: Day1=3, Day2=2, Day3=0, Skipped=0, Failed=0
```

---

## 🔧 Common Operations

### Update Cron Schedule

```bash
# Get machine ID
fly machines list

# Update schedule (example: change to 10am UTC)
fly machine update <machine-id> \
  --schedule daily \
  --schedule-time "10:00"
```

### Manually Trigger Cron Job

```bash
# Option 1: Run locally
pnpm cron:reminders

# Option 2: SSH into Fly machine
fly ssh console
pnpm cron:reminders
```

### Delete a Cron Job

```bash
# List machines
fly machines list

# Destroy specific machine
fly machine destroy <machine-id>
```

---

## 🐛 Troubleshooting

### Cron Jobs Not Running

**Check 1: Are machines created?**
```bash
fly machines list | grep cron
```
If empty → Run `pnpm cron:deploy`

**Check 2: Check logs for errors**
```bash
fly logs | grep "cron-"
```

**Check 3: Test locally first**
```bash
pnpm cron:reminders
```

### Emails Not Sending

**Check 1: Environment variables set?**
```bash
fly secrets list
# Ensure RESEND_API_KEY, DATABASE_URL are set
```

**Check 2: Test email service**
```bash
# Run locally to see detailed error messages
pnpm cron:reminders
```

**Check 3: Resend dashboard**
- Go to [resend.com/emails](https://resend.com/emails)
- Check for delivery errors, bounces

---

## 📚 Documentation Structure

```
kaiwa/
├── CRON_SETUP_SUMMARY.md (this file)         # Quick reference
│
├── scripts/
│   ├── README.md                             # Scripts quick start
│   ├── send-reminders.ts                     # Daily reminders
│   ├── send-founder-emails.ts                # Founder sequence
│   └── deploy-cron-jobs.sh                   # Deployment script
│
└── src/lib/docs/
    ├── architecture-cron-jobs.md             # Detailed architecture (READ THIS!)
    ├── feature-email-reminder-setup.md       # Email setup guide
    └── strategy-founder-email.md             # Email content strategy
```

**Start here**: [architecture-cron-jobs.md](src/lib/docs/architecture-cron-jobs.md)

---

## ✅ Next Steps

1. **Review architecture**: Read [architecture-cron-jobs.md](src/lib/docs/architecture-cron-jobs.md)

2. **Test locally** (recommended):
   ```bash
   pnpm cron:reminders
   pnpm cron:founder-emails
   ```

3. **Deploy to production**:
   ```bash
   pnpm cron:deploy
   ```

4. **Verify deployment**:
   ```bash
   fly machines list
   fly logs | grep "cron-"
   ```

5. **Monitor for 24 hours**:
   - Check logs tomorrow at 9am UTC (reminders)
   - Check logs tomorrow at 2pm UTC (founder emails)

---

## 🎯 Why This Architecture?

### Industry Standard Comparison

| Approach | Reliability | Debugging | Security | Our Choice |
|----------|-------------|-----------|----------|------------|
| **Fly.io Machines** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ **YES** |
| GitHub Actions | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ❌ No |
| HTTP + External | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ❌ No |

**Why Fly.io Machines?**
- ✅ You're already on Fly.io (no new service needed)
- ✅ Most reliable (exact scheduling, not "approximately")
- ✅ Best debugging (same environment, same logs)
- ✅ Most secure (no public endpoints)
- ✅ Free (included in Fly.io plan)

---

## 💡 Pro Tips

1. **Keep HTTP endpoints for testing**: We kept `/api/cron/*` endpoints for manual testing and debugging. They're protected by `CRON_SECRET`.

2. **Monitor Resend dashboard**: Check [resend.com/emails](https://resend.com/emails) daily for the first week to catch any delivery issues.

3. **Set up alerts** (optional): Add PostHog events or Sentry error tracking to get notified of failures.

4. **Start small**: Monitor the first few runs carefully before trusting it completely.

---

## 🔐 Security Checklist

- ✅ CRON_SECRET set in Fly.io secrets
- ✅ RESEND_API_KEY set in Fly.io secrets
- ✅ DATABASE_URL set in Fly.io secrets
- ✅ No secrets in code (all via environment variables)
- ✅ HTTP endpoints protected by CRON_SECRET
- ✅ Cron machines isolated from main app

---

## 📞 Support

**Questions about the architecture?**
- Read: [architecture-cron-jobs.md](src/lib/docs/architecture-cron-jobs.md)

**Cron jobs not working?**
- Check: [Troubleshooting](#-troubleshooting) section above

**Want to change the approach?**
- See: [Migration Path](src/lib/docs/architecture-cron-jobs.md#-migration-path-if-you-change-your-mind) in architecture docs

---

**Status**: ✅ Ready to deploy
**Last updated**: January 2025
**Architecture version**: 2.0 (Fly.io Machines)
