# 🏗️ Cron Job Architecture for Kaiwa

> For the latest unified operations guide (current state, known gaps, recommended changes), see [cron-architecture-unified.md](./cron-architecture-unified.md).

## Overview

Kaiwa uses **Fly.io scheduled machines** to run cron jobs as **separate processes** from the main application. This architecture provides better isolation, reliability, and debugging capabilities compared to traditional HTTP-based cron endpoints.

---

## 🎯 Architecture Decision

### Why Separate Processes (Not HTTP Endpoints)?

| Approach | Our Choice | Why |
|----------|-----------|-----|
| **HTTP Endpoints** | ❌ Not used | Requires main app running, external caller, public exposure, auth overhead |
| **Separate Fly.io Machines** | ✅ **Our approach** | Isolated, more reliable, better logs, no HTTP layer, more secure |
| **GitHub Actions** | ⚠️ Fallback option | Good for quick setup, but less reliable (timing not guaranteed) |

### Benefits of Our Architecture

✅ **Isolation**: Cron failures don't affect main app
✅ **Security**: No public HTTP endpoints to secure
✅ **Reliability**: Runs exactly on schedule (not "approximately")
✅ **Debugging**: Separate logs per job via `fly logs`
✅ **Cost**: Free tier includes scheduled machines
✅ **Simplicity**: Direct code execution, no HTTP layer

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Fly.io App: kaiwa                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ Process: "web" (main application)                 │     │
│  │ ├─ SvelteKit server (port 3000)                   │     │
│  │ ├─ API routes (/api/*)                            │     │
│  │ ├─ Auto-scaling: min=0, scales up on demand       │     │
│  │ └─ VM: 1GB RAM, shared CPU                        │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ Scheduled Machine: "cron-daily-reminders"         │     │
│  │ ├─ Schedule: Daily at 9:00 AM UTC                 │     │
│  │ ├─ Command: tsx scripts/send-reminders.ts         │     │
│  │ ├─ Lifecycle: Starts → Runs → Exits               │     │
│  │ └─ VM: 512MB RAM, shared CPU                      │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ Scheduled Machine: "cron-founder-emails"          │     │
│  │ ├─ Schedule: Daily at 2:00 PM UTC                 │     │
│  │ ├─ Command: tsx scripts/send-founder-emails.ts    │     │
│  │ ├─ Lifecycle: Starts → Runs → Exits               │     │
│  │ └─ VM: 512MB RAM, shared CPU                      │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  All processes share:                                       │
│  - Environment variables (DATABASE_URL, API keys, etc.)     │
│  - Same codebase (built from same Dockerfile)              │
│  - Same database connection                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Organization

```
kaiwa/
├── scripts/                          # Cron job executables
│   ├── send-reminders.ts            # Daily practice reminders
│   ├── send-founder-emails.ts       # Founder email sequence
│   └── deploy-cron-jobs.sh          # Deploy script for all cron jobs
│
├── src/routes/api/cron/             # Legacy HTTP endpoints (kept for manual testing)
│   ├── send-reminders/+server.ts    # Can test via HTTP if needed
│   └── founder-emails/+server.ts    # Can test via HTTP if needed
│
├── src/lib/server/email/            # Shared email services
│   ├── email-reminder.service.ts    # Used by both HTTP and cron
│   └── founder-email.service.ts     # Used by both HTTP and cron
│
└── fly.toml                         # Main app config (cron jobs separate)
```

### Key Principle: **Shared Business Logic**

Both HTTP endpoints and cron scripts use the **same email services**. This means:
- ✅ Can test via HTTP endpoint before deploying cron
- ✅ Can manually trigger via HTTP if needed
- ✅ Single source of truth for business logic

---

## 🚀 Deployment Guide

### 1. Deploy Main Application

```bash
# Standard deployment
fly deploy
```

This deploys the main web application. Cron jobs are **separate**.

### 2. Deploy Cron Jobs

```bash
# Deploy all scheduled cron jobs
./scripts/deploy-cron-jobs.sh
```

This creates two scheduled machines:
1. `cron-daily-reminders` - Runs at 9am UTC daily
2. `cron-founder-emails` - Runs at 2pm UTC daily

### 3. Verify Deployment

```bash
# List all machines (including cron jobs)
fly machines list

# Expected output:
# ID            NAME                     STATE   REGION  ...
# abc123        kaiwa                    started den     ...
# def456        cron-daily-reminders     stopped den     ...
# ghi789        cron-founder-emails      stopped den     ...
```

Cron machines show as "stopped" when not running (they only run on schedule).

---

## 🛠️ Common Operations

### View Logs

```bash
# View all logs (main app + cron jobs)
fly logs

# Filter logs by specific machine
fly logs --instance <machine-id>

# Follow logs in real-time
fly logs -f
```

### Manually Trigger a Cron Job (Testing)

**Option 1: Run script locally**
```bash
# Test with local environment
tsx scripts/send-reminders.ts
tsx scripts/send-founder-emails.ts
```

**Option 2: Run via HTTP endpoint**
```bash
# Test against production
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://trykaiwa.com/api/cron/send-reminders
```

**Option 3: SSH into Fly.io machine**
```bash
# SSH into any machine and run script
fly ssh console
pnpm tsx scripts/send-reminders.ts
```

### Update Cron Schedule

```bash
# Get machine ID
fly machines list

# Update schedule
fly machine update <machine-id> \
  --schedule daily \
  --schedule-time "10:00"  # Change to 10am UTC
```

### Delete a Cron Job

```bash
# List machines
fly machines list

# Delete specific machine
fly machine destroy <machine-id>
```

---

## 🔒 Security

### Environment Variables

All cron jobs have access to the same secrets as your main app:

```bash
# Set secrets (available to all processes)
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set RESEND_API_KEY="re_..."
fly secrets set OPENAI_API_KEY="sk-..."
```

### No Public Exposure

Unlike HTTP-based cron endpoints:
- ❌ No public URLs to protect
- ❌ No authentication headers to manage
- ❌ No risk of unauthorized access
- ✅ Jobs run in isolated machines

### Legacy HTTP Endpoints

We keep HTTP endpoints at `/api/cron/*` for **testing only**:

```typescript
// src/routes/api/cron/send-reminders/+server.ts
export const GET = async ({ request }) => {
  // Still protected by CRON_SECRET for manual testing
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... send reminders
};
```

**Use case**: Manual testing, one-off triggers, debugging.

---

## 📊 Monitoring

### Health Checks

```bash
# Check if cron jobs ran recently
fly logs | grep "cron-"

# Expected output (daily):
# [cron-daily-reminders] 🎉 Reminder process completed!
# [cron-daily-reminders] 📊 Stats: 8 sent, 0 failed
# [cron-founder-emails] 🎉 Founder email sequence completed!
# [cron-founder-emails] 📊 Stats: Day1=3, Day2=2, Day3=1
```

### Key Metrics to Track

1. **Execution frequency**: Are jobs running on schedule?
2. **Success rate**: Check exit codes (0 = success, 1 = failure)
3. **Duration**: How long do jobs take?
4. **Failure logs**: Any errors or exceptions?

### Alerting (Optional)

For production monitoring, integrate with:
- **Sentry**: Error tracking
- **PostHog**: Success/failure events
- **Fly.io notifications**: Machine failure alerts

Example PostHog event:
```typescript
// In scripts/send-reminders.ts
posthog.capture('cron_job_completed', {
  job: 'daily_reminders',
  stats: { sent: 8, failed: 0 },
  duration_ms: 1200
});
```

---

## 🐛 Debugging Guide

### Job Not Running

**Check 1: Is machine created?**
```bash
fly machines list | grep cron
```

If not found → Run `./scripts/deploy-cron-jobs.sh`

**Check 2: Is schedule correct?**
```bash
fly machine status <machine-id>
```

**Check 3: Check logs for errors**
```bash
fly logs | grep "cron-daily-reminders"
```

### Job Running But Failing

**Step 1: Check exit code**
```bash
fly logs | grep "exit"
# Look for "exit code 1" (failure) vs "exit code 0" (success)
```

**Step 2: Run locally to reproduce**
```bash
# Use same environment variables as production
tsx scripts/send-reminders.ts
```

**Step 3: Check database connection**
```bash
# SSH into machine and test DB
fly ssh console
psql $DATABASE_URL -c "SELECT 1"
```

### Emails Not Sending

**Check 1: RESEND_API_KEY set?**
```bash
fly secrets list | grep RESEND
```

**Check 2: Test email service locally**
```typescript
// Test in isolation
import { EmailReminderService } from './src/lib/server/email/email-reminder.service';
await EmailReminderService.sendPracticeReminder('user-id');
```

**Check 3: Check Resend dashboard**
- Go to [resend.com/emails](https://resend.com/emails)
- Check delivery status, bounces, errors

---

## 📈 Scaling Considerations

### Current Setup (Good for 0-10,000 users)

- Cron jobs run **sequentially** (one user at a time)
- Takes ~100ms per email = ~10 emails/second
- 1000 users = ~2 minutes to process
- Fits within Fly.io free tier

### When to Optimize (10,000+ users)

**Option 1: Batch processing**
```typescript
// Process users in batches of 50
const batches = chunk(users, 50);
for (const batch of batches) {
  await Promise.all(batch.map(user => sendEmail(user)));
}
```

**Option 2: Queue-based (Upstash QStash)**
```typescript
// Send each email as separate job
for (const user of users) {
  await qstash.publishJSON({
    url: 'https://trykaiwa.com/api/email/send',
    body: { userId: user.id }
  });
}
```

**Option 3: Multiple cron machines**
```bash
# Create separate machines for different user segments
fly machine run --name "cron-reminders-segment-a" ...
fly machine run --name "cron-reminders-segment-b" ...
```

---

## 🆚 Comparison: HTTP Endpoints vs Scheduled Machines

| Feature | HTTP Endpoints (`/api/cron/*`) | Scheduled Machines (`scripts/*`) |
|---------|-------------------------------|----------------------------------|
| **Reliability** | Depends on external caller | Guaranteed by Fly.io |
| **Timing** | Variable (GitHub Actions ±30min) | Exact (within seconds) |
| **Security** | Requires auth header | No public exposure |
| **Debugging** | Harder (separate systems) | Easier (same environment) |
| **Cost** | Free | Free (Fly.io tier) |
| **Isolation** | Shares main app resources | Separate VM |
| **Logs** | Mixed with app logs | Can filter by machine |
| **Setup** | Easier (just YAML) | Slightly more setup |
| **Best for** | Quick testing, manual triggers | Production reliability |

**Our approach**: Use **both**!
- Scheduled machines for automated, reliable cron jobs
- HTTP endpoints for manual testing and debugging

---

## 🔄 Migration Path (If You Change Your Mind)

### From Fly.io Machines → GitHub Actions

1. Keep HTTP endpoints (`/api/cron/*`)
2. Delete scheduled machines: `fly machine destroy <id>`
3. Create GitHub Actions workflows (see `feature-email-reminder-setup.md`)

### From Fly.io Machines → Upstash QStash

1. Sign up for Upstash: [upstash.com](https://upstash.com)
2. Create schedules via Upstash dashboard
3. Point schedules to HTTP endpoints (`/api/cron/*`)
4. Delete Fly.io machines

### From HTTP Endpoints → Fly.io Machines (Current)

Already done! This is our current architecture.

---

## 📚 Related Documentation

- [Email Reminder System Setup](./feature-email-reminder-setup.md) - Original setup guide
- [Founder Email Strategy](./strategy-founder-email.md) - Email content and strategy
- [Fly.io Machines Documentation](https://fly.io/docs/machines/) - Official Fly.io docs

---

## ✅ Quick Reference

### Deploy cron jobs
```bash
./scripts/deploy-cron-jobs.sh
```

### View cron job status
```bash
fly machines list | grep cron
```

### View cron job logs
```bash
fly logs | grep "cron-"
```

### Manually test a cron job
```bash
tsx scripts/send-reminders.ts
```

### Update cron schedule
```bash
fly machine update <machine-id> --schedule-time "10:00"
```

### Delete a cron job
```bash
fly machine destroy <machine-id>
```

---

## 🆘 Getting Help

**Cron job not running?**
1. Check `fly machines list` - Is machine created?
2. Check `fly logs` - Any errors?
3. Test locally: `tsx scripts/send-reminders.ts`
4. Check secrets: `fly secrets list`

**Still stuck?**
- Fly.io community: [community.fly.io](https://community.fly.io)
- Fly.io docs: [fly.io/docs/machines](https://fly.io/docs/machines/)
- GitHub issues: Open an issue in your repo

---

**Last updated**: January 2025
**Architecture version**: 2.0 (Fly.io Machines)
**Previous version**: 1.0 (HTTP endpoints with external schedulers)
