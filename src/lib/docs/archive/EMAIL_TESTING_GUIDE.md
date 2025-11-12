# Email Testing Guide

This guide helps you preview and test the consolidated email system before enabling automated sending.

## Quick Preview (No Database Required)

View the email HTML templates in your browser:

```bash
npx tsx scripts/preview-emails.ts
```

This generates HTML files you can open in a browser:
- `/tmp/reminder-email-preview.html` - Practice reminder email
- `/tmp/founder-day1-preview.html` - Day 1 founder email
- `/tmp/founder-day2-preview.html` - Day 2 founder email
- `/tmp/founder-day3-preview.html` - Day 3 founder email

## Test with Your Email Address

### Option 1: Using Dry Run (No Emails Sent)

See what would happen without actually sending emails:

```bash
# Start your dev server
pnpm dev

# In another terminal, dry run the cron job
curl -H "Authorization: Bearer development_secret" \
  "http://localhost:5173/api/cron/send-reminders?dryRun=true"
```

This shows you:
- How many users would receive emails
- Which segments they're in (new users, inactive, etc.)
- Preview of subject lines

### Option 2: Send Test Email to Yourself

**Important:** Make sure you have a test user account in your database first!

```bash
# Send a practice reminder to your email only
curl -H "Authorization: Bearer development_secret" \
  "http://localhost:5173/api/cron/send-reminders?dryRun=false&testEmails=YOUR_EMAIL@example.com"

# Send founder email to your email only
curl -H "Authorization: Bearer development_secret" \
  "http://localhost:5173/api/cron/founder-emails?testEmails=YOUR_EMAIL@example.com"
```

Replace `YOUR_EMAIL@example.com` with your actual email address.

### Option 3: Test Multiple Emails at Once

```bash
curl -H "Authorization: Bearer development_secret" \
  "http://localhost:5173/api/cron/send-reminders?dryRun=false&testEmails=email1@example.com,email2@example.com"
```

## Available Cron Endpoints for Testing

All endpoints support `?dryRun=true` and `?testEmails=email@example.com`:

1. **Practice Reminders** (Weekly on Fridays by default)
   ```bash
   /api/cron/send-reminders
   ```

2. **Founder Emails** (Day 1-3 onboarding sequence)
   ```bash
   /api/cron/founder-emails
   ```

3. **Weekly Statistics**
   ```bash
   /api/cron/weekly-stats
   ```

4. **Progress Reports**
   ```bash
   /api/cron/progress-reports
   ```

5. **Product Updates** (Manual POST only)
   ```bash
   curl -X POST \
     -H "Authorization: Bearer development_secret" \
     -H "Content-Type: application/json" \
     -d '{
       "subject": "Test Subject",
       "title": "Test Title",
       "summary": "Test summary",
       "details": "<p>Test details</p>",
       "ctaText": "Try it",
       "ctaUrl": "https://trykaiwa.com"
     }' \
     http://localhost:5173/api/cron/product-updates
   ```

## Email System Overview

### 3 Email Types Users Can Control:

1. **Founder Updates** (`receiveFounderEmails`)
   - Personal updates from Hiro
   - Learning tips and user stories
   - Controlled by user in settings

2. **Product Updates** (`receiveProductUpdates`)
   - New features and improvements
   - Platform changes
   - Controlled by user in settings

3. **Your Statistics** (`receiveProgressReports`)
   - Weekly practice stats
   - Progress insights
   - Controlled by user in settings

4. **Security Alerts** (`receiveSecurityAlerts`)
   - Critical account notifications
   - **ALWAYS ENABLED** (cannot be disabled)

### Current Safety Mode

**ALL automated emails are disabled** until you set:

```bash
ENABLE_AUTOMATED_EMAILS=true
```

This prevents accidental email sends while you're testing.

## Testing Checklist

- [ ] Run `npx tsx scripts/preview-emails.ts` to view HTML templates
- [ ] Open generated HTML files in browser to check formatting
- [ ] Send test email to your own address
- [ ] Verify profile link works (`/profile`)
- [ ] Check email preferences can be toggled
- [ ] Test with multiple email addresses
- [ ] Review dry run output for all cron jobs
- [ ] When ready: Set `ENABLE_AUTOMATED_EMAILS=true` in production

## Troubleshooting

### Emails not sending in test mode?

Check that:
1. `RESEND_API_KEY` is set in `.env`
2. You're using `dryRun=false` for actual sending
3. The test email address exists as a user in your database
4. User hasn't opted out of that email type

### Want to see what would be sent?

Use `?dryRun=true` to see:
- Number of eligible users
- User segments
- Email subjects
- Who would receive emails (without actually sending)

### Testing in production?

1. Use `?testEmails=` to limit to specific addresses
2. Keep `ENABLE_AUTOMATED_EMAILS` unset until you're ready
3. Monitor the first batch carefully
4. Check user feedback on email frequency
