# 📜 Scripts Directory

This directory contains executable scripts for cron jobs, database operations, and deployment tasks.

## 🔄 Cron Jobs

Automated tasks that run on a schedule via **GitHub Actions**.

### Available Cron Jobs

| Script                   | Purpose                            | Schedule              | Command                    |
| ------------------------ | ---------------------------------- | --------------------- | -------------------------- |
| `send-reminders.ts`      | Daily practice reminder emails     | 9am UTC daily         | `pnpm cron:reminders`      |
| `send-founder-emails.ts` | Founder email sequence (3-day)     | 2pm UTC daily         | `pnpm cron:founder-emails` |
| `send-weekly-digest.ts`  | Weekly product updates digest      | 10am UTC Mon          | `pnpm cron:weekly-digest`  |
| `send-weekly-stats.ts`   | Weekly user practice stats         | 11am UTC Mon          | `pnpm cron:weekly-stats`   |

### Architecture

Cron jobs run via **GitHub Actions** that trigger HTTP endpoints on your app:

- ✅ Free (2000 minutes/month on GitHub)
- ✅ Supports precise scheduling (specific times like 9:00 AM)
- ✅ Easy to test via manual workflow dispatch
- ✅ Built-in monitoring via GitHub Actions UI
- ✅ Protected by `CRON_SECRET` environment variable

See [`.github/workflows/cron-jobs.yml`](../.github/workflows/cron-jobs.yml) for the workflow configuration.

---

## Quick Start

### 1. Test locally

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

### 2. Deploy to production

#### Step 1: Set up the CRON_SECRET

```bash
# Set secret in Fly.io (for app endpoints)
fly secrets set CRON_SECRET=your-random-secret-here
```

#### Step 2: Add secret to GitHub

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `CRON_SECRET`
5. Value: (same secret as above)
6. Click "Add secret"

#### Step 3: Push to enable workflows

```bash
git push origin main
```

That's it! GitHub Actions will automatically run the cron jobs on schedule.

### 3. Verify deployment

```bash
# Check GitHub Actions runs
# Go to: https://github.com/YOUR_USERNAME/kaiwa/actions

# Or view app logs when cron runs
fly logs

# Manually trigger a test run (in GitHub)
# Go to: Actions → Scheduled Cron Jobs → Run workflow
```

### 4. Manual testing

You can manually trigger any cron job:

**Via GitHub Actions UI:**

1. Go to Actions → Scheduled Cron Jobs
2. Click "Run workflow"
3. Select which job to run
4. Click "Run workflow"

**Via curl (for testing):**

```bash
# Test daily reminders
curl "https://trykaiwa.com/api/cron/send-reminders?secret=YOUR_SECRET"

# Test founder emails
curl "https://trykaiwa.com/api/cron/founder-emails?secret=YOUR_SECRET"

# Test weekly digest
curl "https://trykaiwa.com/api/cron/weekly-digest?secret=YOUR_SECRET"

# Test weekly stats
curl "https://trykaiwa.com/api/cron/weekly-stats?secret=YOUR_SECRET"
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
# Check GitHub Actions workflow runs
# Go to: https://github.com/YOUR_USERNAME/kaiwa/actions

# Check if workflow is enabled
# Go to: Actions → Scheduled Cron Jobs → Enable if disabled
```

### Problem: Cron job failing

```bash
# 1. Check GitHub Actions logs
# Go to: Actions → Select the failed run → View logs

# 2. Check application logs
fly logs

# 3. Test locally with same environment
pnpm cron:reminders

# 4. Test the HTTP endpoint directly
curl "https://trykaiwa.com/api/cron/send-reminders?secret=YOUR_SECRET"
```

### Problem: Unauthorized error

```bash
# Verify CRON_SECRET is set correctly in both places:

# 1. In Fly.io
fly secrets list | grep CRON

# 2. In GitHub (Settings → Secrets → Actions)
# Check that CRON_SECRET exists

# 3. Make sure the secrets match!
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

- [GitHub Actions Workflow](../.github/workflows/cron-jobs.yml) - Cron job scheduler
- [Architecture: Cron Jobs](../src/lib/docs/architecture-cron-jobs.md) - Detailed architecture
- [Email Reminder Setup](../src/lib/docs/feature-email-reminder-setup.md) - Email configuration
- [Founder Email Strategy](../src/lib/docs/strategy-founder-email.md) - Email content strategy

---

## 🔐 Security Notes

All cron jobs:

- ✅ Protected by `CRON_SECRET` environment variable
- ✅ Triggered via GitHub Actions (trusted environment)
- ✅ HTTP endpoints verify secret before execution
- ✅ Access same environment variables as main app
- ✅ Logs available in both GitHub Actions and Fly.io

---

## 💰 Cost

**GitHub Actions:** FREE (2000 minutes/month included)

Each cron job takes ~10 seconds to run:

- 4 jobs × 30 days × 10 seconds = 1200 seconds/month (~20 minutes)
- Well within the free tier!

---

**Questions?** See [architecture-cron-jobs.md](../src/lib/docs/architecture-cron-jobs.md)
