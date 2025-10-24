# 📜 Scripts Directory

This directory contains executable scripts for cron jobs, database operations, and deployment tasks.

## 🔄 Cron Jobs

Automated tasks that run on a schedule.

### Available Cron Jobs

| Script                   | Purpose                            | Schedule              | Command                    |
| ------------------------ | ---------------------------------- | --------------------- | -------------------------- |
| `send-reminders.ts`      | Daily practice reminder emails     | 9am UTC daily         | `pnpm cron:reminders`      |
| `send-founder-emails.ts` | Founder email sequence (3-day)     | 2pm UTC daily         | `pnpm cron:founder-emails` |
| `send-weekly-digest.ts`  | Weekly product updates digest      | 10am UTC Mon          | `pnpm cron:weekly-digest`  |
| `send-weekly-stats.ts`   | Weekly user practice stats         | 11am UTC Mon          | `pnpm cron:weekly-stats`   |

### Quick Start

**1. Test locally**

```bash
# Test daily reminders
pnpm cron:reminders

# Test founder emails
pnpm cron:founder-emails

# Test weekly digest
pnpm cron:weekly-digest

# Test weekly stats
pnpm cron:weekly-stats
```

**2. Deploy to production**

**⚠️ Limitation:** Fly.io Machines don't support granular cron schedules (specific times like "9:00 AM").

**Choose one approach:**

### Option A: External Cron Service (Recommended - FREE)

Use [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com/) to call your HTTP endpoints:

1. **Set your CRON_SECRET:**

   ```bash
   fly secrets set CRON_SECRET=your-random-secret-here
   ```

2. **Create HTTP cron jobs** on cron-job.org:
   - Daily reminders: `https://trykaiwa.com/api/cron/send-reminders?secret=YOUR_SECRET` at 9:00 AM UTC
   - Founder emails: `https://trykaiwa.com/api/cron/founder-emails?secret=YOUR_SECRET` at 2:00 PM UTC
   - Weekly digest: Create endpoint at `/api/cron/weekly-digest` and schedule for Mon 10:00 AM UTC
   - Weekly stats: Create endpoint at `/api/cron/weekly-stats` and schedule for Mon 11:00 AM UTC

**Cost:** $0/month

### Option B: GitHub Actions (FREE - 2000 minutes/month)

Create `.github/workflows/cron.yml`:

```yaml
name: Cron Jobs
on:
  schedule:
    - cron: '0 9 * * *'    # Daily at 9 AM UTC
    - cron: '0 14 * * *'   # Daily at 2 PM UTC
    - cron: '0 10 * * 1'   # Monday at 10 AM UTC
    - cron: '0 11 * * 1'   # Monday at 11 AM UTC

jobs:
  daily-reminders:
    if: github.event.schedule == '0 9 * * *'
    runs-on: ubuntu-latest
    steps:
      - run: curl "https://trykaiwa.com/api/cron/send-reminders?secret=${{ secrets.CRON_SECRET }}"

  founder-emails:
    if: github.event.schedule == '0 14 * * *'
    runs-on: ubuntu-latest
    steps:
      - run: curl "https://trykaiwa.com/api/cron/founder-emails?secret=${{ secrets.CRON_SECRET }}"

  # Add similar jobs for weekly-digest and weekly-stats
```

**Cost:** $0/month

### Option C: Fly Machines (Limited)

Fly Machines only support simple schedules without specific times:

```bash
# NOT RECOMMENDED: Cannot specify exact times like 9 AM or 2 PM
pnpm cron:deploy
```

**Cost:** ~$0.69/month (storage costs for stopped machines)

---

### Step 3: Create missing HTTP endpoints

You'll need to create these endpoints for weekly jobs:

```typescript
// src/routes/api/cron/weekly-digest/+server.ts
import { sendWeeklyDigest } from '../../../../scripts/send-weekly-digest';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
    const secret = url.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    await sendWeeklyDigest();
    return json({ success: true });
}

// Similar for weekly-stats
```

---

## 🗄️ Database Scripts

| Script               | Purpose                   | Command                        |
| -------------------- | ------------------------- | ------------------------------ |
| `db-health.ts`       | Check database connection | `pnpm db:health`               |
| `run-migration.ts`   | Run custom migrations     | `pnpm db:run-custom-migration` |
| `run-smoke-tests.ts` | Run smoke tests           | `pnpm smoke:test:all`          |

---

## 🐛 Debugging Cron Jobs

### Problem: Cron job not running

```bash
# If using cron-job.org: Check execution history on their dashboard
# If using GitHub Actions: Check workflow runs in GitHub Actions tab
```

### Problem: Cron job failing

```bash
# Check application logs
fly logs

# Test locally with same environment
pnpm cron:reminders
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

- ✅ Protected by `CRON_SECRET` environment variable
- ✅ Access same environment variables as main app
- ✅ Can be triggered via HTTP endpoints
- ✅ No sensitive data in URLs (secret via query param or header)

---

**Questions?** See [architecture-cron-jobs.md](../src/lib/docs/architecture-cron-jobs.md)
