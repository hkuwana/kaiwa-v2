# 📜 Scripts Directory

This directory contains executable scripts for cron jobs, database operations, and deployment tasks.

## 🔄 Cron Jobs

Automated tasks that run on a schedule via Fly.io scheduled machines.

### Available Cron Jobs

| Script | Purpose | Schedule | Command |
|--------|---------|----------|---------|
| `send-reminders.ts` | Daily practice reminder emails | 9am UTC daily | `pnpm cron:reminders` |
| `send-founder-emails.ts` | Founder email sequence (3-day) | 2pm UTC daily | `pnpm cron:founder-emails` |

### Quick Start

**1. Test locally**
```bash
# Test daily reminders
pnpm cron:reminders

# Test founder emails
pnpm cron:founder-emails
```

**2. Deploy to production**
```bash
# Deploy all cron jobs to Fly.io
pnpm cron:deploy

# Or manually
./scripts/deploy-cron-jobs.sh
```

**3. Verify deployment**
```bash
# List all machines (including cron jobs)
fly machines list

# View cron job logs
fly logs | grep "cron-"
```

### Architecture

Cron jobs run as **separate Fly.io machines**, not HTTP endpoints. This provides:
- ✅ Better isolation
- ✅ More reliable scheduling
- ✅ Easier debugging
- ✅ No public HTTP exposure

See the unified operator guide at [../src/lib/docs/cron-architecture-unified.md](../src/lib/docs/cron-architecture-unified.md) for the full architecture and runbook.

---

## 🗄️ Database Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `db-health.ts` | Check database connection | `pnpm db:health` |
| `run-migration.ts` | Run custom migrations | `pnpm db:run-custom-migration` |
| `run-smoke-tests.ts` | Run smoke tests | `pnpm smoke:test:all` |

---

## 🐛 Debugging Cron Jobs

### Problem: Cron job not running

```bash
# Check if machines exist
fly machines list | grep cron

# If not found, deploy them
pnpm cron:deploy
```

### Problem: Cron job failing

```bash
# 1. Check logs
fly logs | grep "cron-daily-reminders"

# 2. Test locally with same environment
pnpm cron:reminders

# 3. Check exit code in logs
fly logs | grep "exit"
# Look for "exit code 0" (success) or "exit code 1" (failure)
```

### Problem: Emails not sending

```bash
# Check RESEND_API_KEY is set
fly secrets list | grep RESEND

# Test email service locally
pnpm cron:reminders
```

---

## 📚 Related Documentation

- [Architecture: Cron Jobs](../src/lib/docs/architecture-cron-jobs.md) - Detailed architecture
- [Email Reminder Setup](../src/lib/docs/feature-email-reminder-setup.md) - Email configuration
- [Founder Email Strategy](../src/lib/docs/strategy-founder-email.md) - Email content strategy

---

## 🔐 Security Notes

All cron jobs:
- ✅ Run in isolated Fly.io machines
- ✅ Access same environment variables as main app
- ✅ No public HTTP exposure
- ✅ Exit after completion (ephemeral)

Legacy HTTP endpoints (`/api/cron/*`) are kept for **manual testing only** and are protected by `CRON_SECRET`.

---

**Questions?** See [architecture-cron-jobs.md](../src/lib/docs/architecture-cron-jobs.md)
