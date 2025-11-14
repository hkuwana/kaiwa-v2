# Migration Guide: Fly.io → GitHub Actions

This document explains the migration from Fly.io scheduled machines to GitHub Actions for cron jobs.

## Overview

### Old Architecture (Fly.io)

- Fly.io machines ran custom cron schedules
- Machines ran TypeScript scripts directly using `tsx`
- Required Fly.io setup and configuration
- Required `fly deploy` to update schedules

**Example (old):**

```bash
fly machine run \
  --schedule "0 10 * * 1" \
  --entrypoint "pnpm" \
  --cmd "tsx scripts/send-weekly-digest.ts"
```

### New Architecture (GitHub Actions)

- GitHub Actions workflows run on schedule
- Workflows make HTTP requests to deployed application
- No special infrastructure needed
- Schedules version-controlled in `.github/workflows/cron-jobs.yml`

**Example (new):**

```yaml
- cron: '0 10 * * 1'  # Monday 10 AM UTC
steps:
  - run: |
      curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
        https://trykaiwa.com/api/cron/weekly-digest
```

## Changes Made

### 1. API Endpoints Created

All cron jobs now trigger HTTP endpoints on the deployed app:

| Old Script                       | New Endpoint                   |
| -------------------------------- | ------------------------------ |
| `scripts/send-reminders.ts`      | `GET /api/cron/send-reminders` |
| `scripts/send-founder-emails.ts` | `GET /api/cron/founder-emails` |
| `scripts/send-weekly-digest.ts`  | `GET /api/cron/weekly-digest`  |
| `scripts/send-weekly-stats.ts`   | `GET /api/cron/weekly-stats`   |

**Endpoints location:** `src/routes/api/cron/*/+server.ts`

### 2. Authentication Changed

**Old method (query parameter):**

```
GET /api/cron/weekly-digest?secret=YOUR_SECRET
```

**New method (Bearer token):**

```
GET /api/cron/weekly-digest
Authorization: Bearer YOUR_SECRET
```

### 3. Workflow Configuration

GitHub Actions workflows defined in `.github/workflows/cron-jobs.yml`:

- 4 jobs, one per endpoint
- Conditional execution based on schedule
- Manual trigger support for testing
- Curl requests with proper error handling

### 4. Environment Setup

**GitHub Secrets Required:**

- `CRON_SECRET` - The secret token for authentication

Already in `.github/workflows/ci-cd.yml`:

- Database and service credentials
- Third-party API keys
- Deployment tokens

## What Stayed the Same

### Email Services

- All email service classes unchanged
- `WeeklyUpdatesEmailService`
- `WeeklyStatsEmailService`
- `EmailReminderService`
- `FounderEmailService`

### Database Access

- Repository classes unchanged
- User queries and updates identical
- Email permission system unchanged

### Email Sending

- Resend API unchanged
- Email templates unchanged
- Rate limiting logic identical (100ms delays, 24h per user limits)

## Manual Scripts

The `scripts/` directory files still exist and can be run manually:

```bash
# Still works for manual execution
tsx scripts/send-reminders.ts
tsx scripts/send-weekly-digest.ts
```

However, these are **not used by the cron system anymore**. The endpoint implementations in `src/routes/api/cron/` are the canonical source.

## Testing

### Test an Endpoint

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://trykaiwa.com/api/cron/send-reminders?dryRun=true
```

### Manual Trigger from GitHub

1. Actions → Scheduled Cron Jobs
2. Run workflow
3. Select job and click "Run"

### Local Testing

Can't easily test the HTTP endpoints locally without a running server, but you can:

1. Run `pnpm build && pnpm preview` to run production build locally
2. Test with `curl` against `http://localhost:5173/api/cron/...`

## Benefits of New Approach

| Aspect              | Fly.io                | GitHub Actions              |
| ------------------- | --------------------- | --------------------------- |
| **Cost**            | Extra infrastructure  | Free (included with GitHub) |
| **Configuration**   | Fly.io CLI + commands | YAML files in repo          |
| **Debugging**       | Fly.io dashboard      | GitHub Actions UI + logs    |
| **Version Control** | Not tracked           | .github/workflows/          |
| **Testing**         | Manual via scripts    | Easy with curl + dry-run    |
| **Infrastructure**  | Separate setup        | Same server as app          |
| **Deployment**      | fly deploy            | git push (auto-deploy)      |

## Rollback Plan

If you need to revert to Fly.io:

1. **Disable GitHub Actions workflow:**

   ```bash
   # Comment out or delete .github/workflows/cron-jobs.yml
   ```

2. **Create Fly.io machines:**

   ```bash
   fly machine run \
     --schedule "0 9 * * *" \
     --entrypoint "pnpm" \
     --cmd "tsx scripts/send-reminders.ts"
   ```

3. **Restore scripts (they still exist):**
   - Scripts in `scripts/` directory are unchanged
   - All logic and dependencies intact

## Troubleshooting Migration

### Endpoints Return 401

- **Problem:** CRON_SECRET not set or invalid
- **Solution:** Check GitHub secrets settings, verify Bearer token format

### Endpoints Return 500

- **Problem:** Service error during email sending
- **Solution:** Check application logs, verify database connectivity

### Workflow Not Triggering

- **Problem:** Workflow disabled or schedule misconfigured
- **Solution:** Check workflow is enabled, verify cron syntax (must be UTC)

### Content Not Updated for Weekly Digest

- **Problem:** Need to update digest content but endpoint is hardcoded
- **Solution:** Edit [src/routes/api/cron/weekly-digest/+server.ts](../../src/routes/api/cron/weekly-digest/+server.ts), update `thisWeeksContent`, deploy

## Configuration Reference

### GitHub Secrets

```
CRON_SECRET=your_secret_here
```

### Workflow Schedule (UTC only)

```yaml
on:
  schedule:
    - cron: '0 9 * * *' # Daily 9 AM
    - cron: '0 14 * * *' # Daily 2 PM
    - cron: '0 10 * * 1' # Monday 10 AM
    - cron: '0 11 * * 1' # Monday 11 AM
```

### Authentication Header

All requests require:

```
Authorization: Bearer {CRON_SECRET}
```

## Files Changed

### Created

- `.github/workflows/cron-jobs.yml` - GitHub Actions workflow
- `.github/cron/README.md` - Documentation
- `.github/cron/API_REFERENCE.md` - API reference
- `.github/cron/MIGRATION_GUIDE.md` - This file
- `src/routes/api/cron/weekly-digest/+server.ts` - Endpoint implementation
- `src/routes/api/cron/weekly-stats/+server.ts` - Endpoint implementation

### Modified

- `src/routes/api/cron/send-reminders/+server.ts` - Updated to use Bearer token
- `src/routes/api/cron/founder-emails/+server.ts` - Updated to use Bearer token

### Unchanged (but still relevant)

- `scripts/send-reminders.ts` - Still works for manual runs
- `scripts/send-weekly-digest.ts` - Still works for manual runs
- `scripts/send-weekly-stats.ts` - Still works for manual runs
- `scripts/send-founder-emails.ts` - Still works for manual runs
- All email service implementations

## Next Steps

1. ✅ Deploy code changes
2. ✅ Verify CRON_SECRET in GitHub secrets
3. ✅ Disable old Fly.io scheduled machines (if applicable)
4. ✅ Monitor first scheduled runs via GitHub Actions UI
5. ✅ Verify emails are being sent correctly
6. ✅ Set up monitoring for failed runs (optional: GitHub notifications)

## Support

If you encounter issues:

1. Check `.github/cron/README.md` for overview
2. Check `.github/cron/API_REFERENCE.md` for endpoint details
3. Review GitHub Actions logs for error messages
4. Check application logs in deployment dashboard
5. Review email service status (Resend dashboard)

## See Also

- [README](./README.md) - Cron jobs overview
- [API_REFERENCE.md](./API_REFERENCE.md) - Detailed endpoint documentation
- [cron-jobs.yml](./cron-jobs.yml) - Workflow configuration
