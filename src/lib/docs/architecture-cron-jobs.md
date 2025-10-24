# 🏗️ Cron Job Architecture for Kaiwa

> For the latest unified operations guide (current state, known gaps, recommended changes), see [cron-architecture-unified.md](./cron-architecture-unified.md).

## Overview

Kaiwa uses **GitHub Actions** to run cron jobs by triggering **HTTP endpoints** on the Fly.io-hosted application. This architecture provides precise scheduling, zero infrastructure cost, and easy testing capabilities.

---

## 🎯 Architecture Decision

### Why GitHub Actions + HTTP Endpoints?

| Approach                         | Our Choice          | Why                                                                                    |
| -------------------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| **Fly.io Scheduled Machines**    | ❌ Not supported    | Cannot specify exact times (9 AM, 2 PM) - only supports "daily"/"weekly"              |
| **GitHub Actions + HTTP**        | ✅ **Our approach** | Free, precise timing, easy testing, built-in monitoring, no extra infrastructure       |
| **External Cron Services**       | ⚠️ Alternative      | Similar to GitHub Actions but requires external account                                |

### Benefits of Our Architecture

✅ **Zero Cost**: Free within GitHub Actions tier (2000 min/month)
✅ **Precise Timing**: Supports exact times (9:00 AM, 2:00 PM, etc.)
✅ **Easy Testing**: Manual triggers via GitHub UI
✅ **Built-in Monitoring**: GitHub Actions logs and history
✅ **No Extra Infrastructure**: No Fly.io cron machines needed
✅ **Simple Deployment**: Just push to GitHub

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────┐
│ GitHub Actions (Scheduler - FREE)                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Workflow: cron-jobs.yml                                   │
│  ├─ 9:00 AM UTC daily   → curl /api/cron/send-reminders  │
│  ├─ 2:00 PM UTC daily   → curl /api/cron/founder-emails  │
│  ├─ 10:00 AM Mon UTC    → curl /api/cron/weekly-digest   │
│  └─ 11:00 AM Mon UTC    → curl /api/cron/weekly-stats    │
│                                                            │
└──────────────────┬─────────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌────────────────────────────────────────────────────────────┐
│ Fly.io App: kaiwa                                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  HTTP Endpoints:                                           │
│  ├─ /api/cron/send-reminders    (protected by secret)    │
│  ├─ /api/cron/founder-emails    (protected by secret)    │
│  ├─ /api/cron/weekly-digest     (protected by secret)    │
│  └─ /api/cron/weekly-stats      (protected by secret)    │
│                                                            │
│  Scripts (called by endpoints):                            │
│  ├─ scripts/send-reminders.ts                             │
│  ├─ scripts/send-founder-emails.ts                        │
│  ├─ scripts/send-weekly-digest.ts                         │
│  └─ scripts/send-weekly-stats.ts                          │
│                                                            │
│  Shared Services:                                          │
│  ├─ Email services (Resend)                               │
│  ├─ Database (Postgres)                                   │
│  └─ Environment variables (secrets)                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Key Points:**

- **GitHub Actions** = Free scheduler that calls your app's HTTP endpoints
- **Fly.io** = Your app handles the actual work (sending emails, etc.)
- **No Fly.io cron machines** = Saves ~$0.69/month and avoids scheduling limitations

---

## 📁 File Organization

```
kaiwa/
├── .github/workflows/
│   └── cron-jobs.yml                  # GitHub Actions workflow (scheduler)
│
├── scripts/                           # Cron job executables
│   ├── send-reminders.ts             # Daily practice reminders
│   ├── send-founder-emails.ts        # Founder email sequence
│   ├── send-weekly-digest.ts         # Weekly product updates
│   └── send-weekly-stats.ts          # Weekly practice stats
│
├── src/routes/api/cron/              # HTTP endpoints (triggered by GitHub Actions)
│   ├── send-reminders/+server.ts     # Endpoint for daily reminders
│   ├── founder-emails/+server.ts     # Endpoint for founder emails
│   ├── weekly-digest/+server.ts      # Endpoint for weekly digest
│   └── weekly-stats/+server.ts       # Endpoint for weekly stats
│
└── src/lib/server/email/             # Shared email services
    ├── email-reminder.service.ts     # Used by cron endpoints
    ├── founder-email.service.ts      # Used by cron endpoints
    └── weekly-stats-email.service.ts # Used by cron endpoints
```

### Key Principle: **HTTP Endpoints → Scripts → Services**

```
GitHub Actions
    ↓
HTTP Endpoint (auth check)
    ↓
Script (business logic)
    ↓
Email Service (send emails)
```

---

## 🚀 Deployment Guide

### 1. Set Up CRON_SECRET

```bash
# Generate a secure random secret
SECRET=$(openssl rand -base64 32)

# Set in Fly.io (for HTTP endpoint authentication)
fly secrets set CRON_SECRET=$SECRET

# Add to GitHub repository secrets
# Go to: Settings → Secrets and variables → Actions → New repository secret
# Name: CRON_SECRET
# Value: (paste the secret from above)
```

### 2. Push to GitHub

```bash
git push origin main
```

That's it! GitHub Actions will automatically start running the cron jobs on schedule.

### 3. Verify Deployment

**Check GitHub Actions:**

- Go to your repo → Actions tab
- Look for "Scheduled Cron Jobs" workflow
- Check recent runs for success/failure

**Check application logs:**

```bash
fly logs
# Look for log entries when cron jobs run
```

---

## 🛠️ Common Operations

### View Cron Job History

```bash
# Go to GitHub: https://github.com/YOUR_USERNAME/kaiwa/actions
# Click on "Scheduled Cron Jobs" workflow
# View past runs, timing, and logs
```

### Manually Trigger a Cron Job

**Option 1: GitHub Actions UI (Recommended)**

1. Go to Actions → Scheduled Cron Jobs
2. Click "Run workflow"
3. Select which job to run
4. Click "Run workflow"

**Option 2: Run script locally**

```bash
# Test with local environment
pnpm cron:reminders
pnpm cron:founder-emails
pnpm cron:weekly-digest
pnpm cron:weekly-stats
```

**Option 3: Call HTTP endpoint directly**

```bash
# Test against production
curl "https://trykaiwa.com/api/cron/send-reminders?secret=YOUR_SECRET"
```

### Update Cron Schedule

Edit `.github/workflows/cron-jobs.yml`:

```yaml
on:
  schedule:
    - cron: '0 10 * * *'  # Change to 10:00 AM UTC
```

Then push to GitHub:

```bash
git add .github/workflows/cron-jobs.yml
git commit -m "Update cron schedule to 10 AM"
git push
```

### Disable a Cron Job

**Option 1: Disable entire workflow**

```bash
# Go to: Actions → Scheduled Cron Jobs → ⋯ → Disable workflow
```

**Option 2: Remove specific job from workflow**

Edit `.github/workflows/cron-jobs.yml` and remove the job section.

---

## 🔒 Security

### Environment Variables

All cron jobs have access to your app's environment variables via HTTP endpoints:

```bash
# Set secrets (available to all endpoints)
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set RESEND_API_KEY="re_..."
fly secrets set OPENAI_API_KEY="sk-..."
```

### Authentication

Each HTTP endpoint verifies the `CRON_SECRET`:

```typescript
// src/routes/api/cron/send-reminders/+server.ts
export const GET: RequestHandler = async ({ url }) => {
    const secret = url.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || secret !== cronSecret) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Execute cron job...
};
```

### Best Practices

- ✅ Use strong random secrets (32+ characters)
- ✅ Keep `CRON_SECRET` consistent between Fly.io and GitHub
- ✅ Never commit secrets to git
- ✅ Rotate secrets periodically
- ✅ Monitor for unauthorized access attempts

---

## 📊 Monitoring

### GitHub Actions Monitoring

```bash
# View in GitHub UI:
# - Success/failure status
# - Execution time
# - Full logs for each run
# - Email notifications for failures (can be enabled)
```

### Application Logs

```bash
# View application logs when cron runs
fly logs

# Filter for cron-related logs
fly logs | grep "cron"

# Look for:
# "Starting weekly stats cron job..."
# "✅ Weekly stats cron job completed"
```

### Key Metrics to Track

1. **Execution frequency**: Are jobs running on schedule?
2. **Success rate**: Check GitHub Actions success/failure
3. **Duration**: How long do jobs take?
4. **Emails sent**: Check application logs for counts

### Health Checks

```bash
# Check recent GitHub Actions runs
# Go to: https://github.com/YOUR_USERNAME/kaiwa/actions

# Check application health
curl https://trykaiwa.com/health

# Test cron endpoint manually
curl "https://trykaiwa.com/api/cron/send-reminders?secret=YOUR_SECRET"
```

---

## 🐛 Debugging Guide

### Job Not Running

**Check 1: Is workflow enabled?**

```bash
# Go to: Actions → Scheduled Cron Jobs
# If disabled, click "Enable workflow"
```

**Check 2: Is CRON_SECRET set in GitHub?**

```bash
# Go to: Settings → Secrets and variables → Actions
# Verify CRON_SECRET exists
```

**Check 3: Check GitHub Actions logs**

```bash
# Go to: Actions → Select the failed run → View logs
# Look for errors in the curl command
```

### Job Running But Failing

**Step 1: Check GitHub Actions logs**

Look for HTTP response codes:

- `200` = Success
- `401` = Unauthorized (wrong CRON_SECRET)
- `500` = Server error (check application logs)

**Step 2: Check application logs**

```bash
fly logs

# Look for errors in the cron job execution
```

**Step 3: Test endpoint directly**

```bash
# Test with curl to see full response
curl -v "https://trykaiwa.com/api/cron/send-reminders?secret=YOUR_SECRET"
```

**Step 4: Run script locally**

```bash
# Reproduce the issue locally
pnpm cron:reminders
```

### Unauthorized Error (401)

**Problem**: `CRON_SECRET` mismatch between Fly.io and GitHub

**Solution**:

```bash
# 1. Check what's set in Fly.io
fly secrets list | grep CRON

# 2. Update GitHub secret to match
# Go to: Settings → Secrets → Actions → CRON_SECRET → Update

# 3. Or regenerate both:
SECRET=$(openssl rand -base64 32)
fly secrets set CRON_SECRET=$SECRET
# Then update in GitHub
```

### Emails Not Sending

**Check 1: RESEND_API_KEY set?**

```bash
fly secrets list | grep RESEND
```

**Check 2: Test email service locally**

```bash
pnpm cron:reminders
```

**Check 3: Check Resend dashboard**

- Go to [resend.com/emails](https://resend.com/emails)
- Check delivery status, bounces, errors

---

## 📈 Scaling Considerations

### Current Setup (Good for 0-50,000 users)

- Each cron job runs sequentially
- Takes ~100ms per email
- 1000 users = ~2 minutes
- Well within GitHub Actions limits

### When to Optimize (50,000+ users)

**Option 1: Batch processing in parallel**

```typescript
const batches = chunk(users, 50);
for (const batch of batches) {
    await Promise.all(batch.map(user => sendEmail(user)));
}
```

**Option 2: Split into multiple workflows**

```yaml
# .github/workflows/cron-reminders-batch-1.yml
- cron: '0 9 * * *'  # First half of users

# .github/workflows/cron-reminders-batch-2.yml
- cron: '5 9 * * *'  # Second half of users (5 min later)
```

**Option 3: Move to dedicated queue (Upstash QStash)**

For very large scale, consider a proper job queue system.

---

## 💰 Cost Breakdown

### GitHub Actions (FREE Tier)

- **Included**: 2000 minutes/month
- **Our usage**: ~20 minutes/month
- **Cost**: $0/month

Breakdown:

- Daily reminders: ~10 seconds × 30 days = 5 minutes
- Founder emails: ~10 seconds × 30 days = 5 minutes
- Weekly digest: ~10 seconds × 4 weeks = 1 minute
- Weekly stats: ~10 seconds × 4 weeks = 1 minute
- **Total**: ~12 minutes/month (0.6% of free tier)

### Fly.io

- No cron machines needed
- Just your regular app running
- **Cost**: $0 extra for cron functionality

### Total Cron Cost: $0/month

---

## 🆚 Comparison: Previous vs Current Architecture

| Feature             | Fly.io Machines (Attempted)          | GitHub Actions (Current)              |
| ------------------- | ------------------------------------ | ------------------------------------- |
| **Scheduling**      | ❌ No specific times                 | ✅ Exact times (9:00 AM, etc.)        |
| **Cost**            | ~$0.69/month                         | $0/month                              |
| **Setup**           | Complex (machine configs)            | Simple (YAML workflow)                |
| **Testing**         | SSH into machine                     | Click button in GitHub UI             |
| **Monitoring**      | Fly.io logs                          | GitHub Actions UI + Fly.io logs       |
| **Reliability**     | Very reliable                        | Very reliable (99.9% uptime)          |
| **Logs**            | Fly.io only                          | Both GitHub Actions and Fly.io        |
| **Manual Trigger**  | SSH required                         | Button in GitHub UI                   |
| **Deployment**      | Separate deploy script               | Automatic on git push                 |

---

## 📚 Related Documentation

- [GitHub Actions Workflow](../../.github/workflows/cron-jobs.yml) - Cron job scheduler
- [Scripts README](../../scripts/README.md) - Deployment and testing guide
- [Email Reminder System Setup](./feature-email-reminder-setup.md) - Original setup guide
- [Founder Email Strategy](./strategy-founder-email.md) - Email content and strategy

---

## ✅ Quick Reference

### Test cron job locally

```bash
pnpm cron:reminders
pnpm cron:weekly-stats
```

### Manually trigger via GitHub

```bash
# Go to: Actions → Scheduled Cron Jobs → Run workflow
```

### View cron job logs

```bash
# GitHub Actions: https://github.com/YOUR_USERNAME/kaiwa/actions
# Application: fly logs
```

### Update schedule

```bash
# Edit .github/workflows/cron-jobs.yml
# Push to GitHub
```

### Check if CRON_SECRET is set

```bash
fly secrets list | grep CRON
# Also check: Settings → Secrets → Actions in GitHub
```

---

## 🆘 Getting Help

**Cron job not running?**

1. Check GitHub Actions → Is workflow enabled?
2. Check GitHub Actions logs → Any errors?
3. Test locally: `pnpm cron:reminders`
4. Check secrets match in both Fly.io and GitHub

**Still stuck?**

- GitHub Actions docs: [docs.github.com/actions](https://docs.github.com/actions)
- Fly.io community: [community.fly.io](https://community.fly.io)
- Resend support: [resend.com/support](https://resend.com/support)

---

**Last updated**: October 2024
**Architecture version**: 3.0 (GitHub Actions)
**Previous versions**:

- 2.0 (Attempted Fly.io Machines - blocked by scheduling limitations)
- 1.0 (HTTP endpoints with external schedulers)
