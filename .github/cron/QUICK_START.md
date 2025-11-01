# Quick Start: Managing Cron Jobs

## The Basics

All scheduled jobs trigger HTTP endpoints on your deployed app via GitHub Actions.

**When:** Jobs run on schedule (see `.github/workflows/cron-*.yml`)
**How:** GitHub Actions makes authenticated HTTP requests
**Where:** `https://trykaiwa.com/api/cron/{endpoint-name}`

## Current Jobs

| Time                  | Job            | What It Does                                   |
| --------------------- | -------------- | ---------------------------------------------- |
| **9 AM UTC** Mon & Thu | Practice Check-ins | Email practice reminders to inactive users     |
| **2 PM UTC** Daily    | Founder Emails | Personal emails to new users (days 1-3 signup) |
| **10 AM UTC** Sundays | Weekly Digest  | Product updates to all opted-in users          |
| **11 AM UTC** Saturdays | Weekly Stats   | Personal stats to all opted-in users           |
| **10 AM UTC** Tuesdays | Scenario Inspiration | Two scenarios matched to learner preferences |
| **10 AM UTC** Fridays | Community Story | Authentic learner win + playbook CTA           |

## Quick Tasks

### View Job Results

1. Go to GitHub → Actions → "Scheduled Cron Jobs"
2. Click on a recent run
3. Expand the job to see logs and results

### Manually Trigger a Job

1. Go to GitHub → Actions → "Scheduled Cron Jobs"
2. Click "Run workflow"
3. Select which job(s)
4. Click "Run workflow"

### Update Weekly Digest Content

1. Edit `src/routes/api/cron/weekly-digest/+server.ts`
2. Update the `thisWeeksContent` variable
3. Deploy or push to main
4. Content takes effect at next scheduled run (10 AM Sunday UTC)

### Test an Endpoint

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://trykaiwa.com/api/cron/send-reminders?dryRun=true
```

### Check Status

- Endpoint returns `"success": true` if everything worked
- Check the `sent` count to see how many emails were sent
- Admin receives summary email with detailed results

## Troubleshooting

### Emails Not Being Sent

1. Check user email preferences in database (user_settings.email_permissions)
2. Try dry-run to see who would receive: `?dryRun=true`
3. Check logs in GitHub Actions for error messages
4. Verify database connection is working

### Endpoint Returning 401

1. Make sure CRON_SECRET is set in GitHub secrets
2. Verify the Authorization header format: `Bearer {SECRET}`
3. Check that the secret value is correct

### Workflow Not Running

1. Check workflow is enabled in GitHub
2. Verify schedule is in UTC (GitHub only supports UTC)
3. Check `cron-jobs.yml` for correct cron syntax

## Documentation

- **[README.md](./README.md)** - Complete overview and setup
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Detailed API documentation
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Why/how we moved from Fly.io

## Implementation Files

The actual endpoint code is here:

- `src/routes/api/cron/send-reminders/+server.ts`
- `src/routes/api/cron/founder-emails/+server.ts`
- `src/routes/api/cron/weekly-digest/+server.ts`
- `src/routes/api/cron/weekly-stats/+server.ts`

The workflow is here:

- `.github/workflows/cron-jobs.yml`

## Common Issues & Fixes

**Issue:** Endpoint returns 401

```bash
# Fix: Use correct Bearer token format
curl -H "Authorization: Bearer YOUR_SECRET" \
  https://trykaiwa.com/api/cron/endpoint-name
```

**Issue:** No emails being sent but endpoint returns 200

```bash
# Fix: Check email preferences
# Look in database: SELECT * FROM user_settings WHERE user_id = 'user-id'
# Check email_permissions field
```

**Issue:** Digest content not updating

```bash
# Fix: Content is hardcoded in the endpoint file
# Edit src/routes/api/cron/weekly-digest/+server.ts
# Update thisWeeksContent variable
# Deploy the changes
```

**Issue:** Workflow not running on schedule

```bash
# Fix: Check if scheduled in UTC
# GitHub Actions only supports UTC times
# Verify cron syntax: https://crontab.guru
```

## Need Help?

1. **For endpoint issues:** See [API_REFERENCE.md](./API_REFERENCE.md)
2. **For setup issues:** See [README.md](./README.md)
3. **For questions about the migration:** See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
4. **For workflow issues:** Check `.github/workflows/cron-jobs.yml`

---

**Next:** Read [README.md](./README.md) for complete documentation.
