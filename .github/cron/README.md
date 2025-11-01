# Cron Jobs Management

This directory contains documentation and configuration for all scheduled cron jobs running via GitHub Actions.

## Overview

All cron jobs trigger HTTP endpoints on the deployed application. The endpoints are secured with a `CRON_SECRET` environment variable that must be passed as a Bearer token in the Authorization header.

**Base URL:** `https://trykaiwa.com/api/cron`

**Authentication:** All requests require the header:

```
Authorization: Bearer {CRON_SECRET}
```

## Scheduled Jobs

### 1. Practice Reminder Check-ins

- **Schedule:** Mondays & Thursdays at 9:00 AM UTC
- **Endpoint:** `GET /api/cron/send-reminders`
- **Purpose:** Send practice reminders to users who haven't practiced in 1-30+ days
- **User Segmentation:**
  - New users (never practiced)
  - Slightly inactive (1-3 days)
  - Moderately inactive (3-7 days)
  - Highly inactive (7-30 days)
  - Dormant (30+ days)
- **Implementation:** [src/routes/api/cron/send-reminders/+server.ts](../../src/routes/api/cron/send-reminders/+server.ts)

### 2. Founder Emails

- **Schedule:** Every day at 2:00 PM UTC
- **Endpoint:** `GET /api/cron/founder-emails`
- **Purpose:** Send personalized email sequence from founder to new users
- **Sequence:**
  - Day 1: Warm welcome
  - Day 2: Check-in + offer to help
  - Day 3: Personal offer to talk (calendar link)
- **Implementation:** [src/routes/api/cron/founder-emails/+server.ts](../../src/routes/api/cron/founder-emails/+server.ts)

### 3. Weekly Digest

- **Schedule:** Every Sunday at 10:00 AM UTC
- **Endpoint:** `GET /api/cron/weekly-digest`
- **Purpose:** Send weekly product updates to all opted-in users
- **Content Sections:**
  - Updates (2-4 items what shipped)
  - Product highlights (0-2 items)
  - Upcoming (0-3 items coming next)
- **Implementation:** [src/routes/api/cron/weekly-digest/+server.ts](../../src/routes/api/cron/weekly-digest/+server.ts)
- **Note:** Update the content in the endpoint file before each Sunday send

### 4. Weekly Stats

- **Schedule:** Every Saturday at 11:00 AM UTC
- **Endpoint:** `GET /api/cron/weekly-stats`
- **Purpose:** Send personalized weekly practice statistics
- **Stats Included:**
  - Practice minutes
  - Sessions count
  - Days active
  - Most practiced language
  - Comparison to previous week
- **Implementation:** [src/routes/api/cron/weekly-stats/+server.ts](../../src/routes/api/cron/weekly-stats/+server.ts)

### 5. Scenario Inspiration Pairing

- **Schedule:** Every Tuesday at 10:00 AM UTC
- **Endpoint:** `GET /api/cron/scenario-inspiration`
- **Purpose:** Send two curated scenarios matched to each learner's motivation, challenge preference, and recent activity
- **Highlights:**
  - Pulls data from user preferences + recent sessions
  - Recommends a primary scenario and a stretch option
  - Logs analytics event `scenario_inspiration_sent`
- **Implementation:** [src/routes/api/cron/scenario-inspiration/+server.ts](../../src/routes/api/cron/scenario-inspiration/+server.ts)

### 6. Community Story Spotlight

- **Schedule:** Every Friday at 10:00 AM UTC
- **Endpoint:** `GET /api/cron/community-stories`
- **Purpose:** Share authentic learner wins tailored to the recipient's learning goal with an actionable playbook
- **Highlights:**
  - Pulls stories from curated data set by motivation
  - Summarizes the learner's weekly progress
  - Logs analytics event `community_story_sent`
- **Implementation:** [src/routes/api/cron/community-stories/+server.ts](../../src/routes/api/cron/community-stories/+server.ts)

## Testing

### Manual Endpoint Testing

Test any endpoint with:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://trykaiwa.com/api/cron/{endpoint-name}
```

For example:

```bash
# Test daily reminders in dry-run mode
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://trykaiwa.com/api/cron/send-reminders?dryRun=true"

# Test with specific test emails
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://trykaiwa.com/api/cron/send-reminders?testEmails=user@example.com,other@example.com"
```

### Query Parameters

**send-reminders endpoint:**

- `dryRun=true` - Preview what would be sent without sending
- `testEmails=email1,email2` - Only send to specific emails (for testing)

**Other endpoints:**

- Currently no special query parameters (configuration is in the endpoint file)

## GitHub Actions Workflow

Each cron job has its own workflow file under `.github/workflows/`:

- `cron-daily-reminders.yml`
- `cron-founder-emails.yml`
- `cron-weekly-product-updates.yml`
- `cron-weekly-stats.yml`
- `cron-scenario-inspiration.yml`
- `cron-community-stories.yml`

All workflows support manual triggers via `workflow_dispatch` and call the corresponding HTTP endpoint.

### Manual Trigger

You can manually trigger any cron job from GitHub:

1. Go to Actions → Scheduled Cron Jobs
2. Click "Run workflow"
3. Select which job to run: reminders, founder-emails, weekly digests/stats, scenario inspiration, or community stories
4. Click "Run workflow"

## Implementation Details

### API Endpoints

All endpoints are SvelteKit server endpoints that:

1. Verify the CRON_SECRET via Authorization header
2. Execute the corresponding email service
3. Return JSON response with stats (sent, skipped, errors)
4. Send admin summary email with detailed results

### Error Handling

- Failed emails are logged but don't fail the entire job
- Admin receives a summary email with detailed stats
- Errors are tracked and returned in the response

### Rate Limiting

- Daily reminders: Max 1 per user per 24 hours
- Founder emails: Max 1 per user per 20 hours
- Small 100ms delay between each email to prevent rate limiting

## Environment Variables

Required in `.env` or GitHub secrets:

- `CRON_SECRET` - Authentication token for cron endpoints
- `RESEND_API_KEY` - Email service API key
- `DATABASE_URL` - Database connection string
- `OPENAI_API_KEY` - AI service key
- Plus other standard app env vars

## Troubleshooting

### Endpoints returning 401 Unauthorized

- Check that `CRON_SECRET` is set in GitHub secrets
- Verify the Authorization header is in format: `Bearer {CRON_SECRET}`
- Note: The old query param method (`?secret=`) is deprecated

### No emails being sent

- Check email preferences in user_settings table (email_permissions)
- Use `dryRun=true` to see who would receive emails
- Check admin emails for detailed error logs
- Verify the email service (Resend) is configured correctly

### Jobs not running on schedule

- Check GitHub Actions workflow is enabled
- Verify the schedule in cron-jobs.yml uses correct cron syntax
- GitHub uses UTC only - times must be in UTC

## Maintenance

### Weekly Digest Content Updates

Before each Sunday 10 AM UTC send:

1. Update the content in [src/routes/api/cron/weekly-digest/+server.ts](../../src/routes/api/cron/weekly-digest/+server.ts)
2. Update the `thisWeeksContent` variable with:
   - What shipped this week (in `updates`)
   - Product highlights (in `productHighlights`)
   - What's coming next (in `upcoming`)
3. Test with the endpoint before the scheduled time

### Monitoring

- Monitor GitHub Actions workflow runs for failures
- Check email logs in Resend dashboard
- Review admin summary emails for stats

## Migration from Fly.io

This setup replaces the previous Fly.io scheduled machines with GitHub Actions:

**Old:** Fly.io machines with cron schedules
**New:** GitHub Actions scheduled workflows triggering HTTP endpoints

**Benefits:**

- ✅ No extra infrastructure costs
- ✅ Same reliability as before
- ✅ Easier to test and debug
- ✅ Better integration with GitHub
- ✅ Version control for schedules

## Related Files

- [cron-jobs.yml](./cron-jobs.yml) - GitHub Actions workflow configuration
- [src/routes/api/cron/](../../src/routes/api/cron/) - API endpoint implementations
- [src/lib/server/email/](../../src/lib/server/email/) - Email service implementations
- [scripts/](../../scripts/) - Standalone scripts (legacy, can be run manually)
