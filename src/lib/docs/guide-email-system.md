# Email System Guide

## Overview

Kaiwa uses **Resend** for transactional emails and has a comprehensive preference system that gives users granular control over what they receive. This guide covers setup, testing, preferences, and the cron job architecture.

---

## Table of Contents

1. [Email Types & User Preferences](#email-types--user-preferences)
2. [Setup Instructions](#setup-instructions)
3. [Testing Emails](#testing-emails)
4. [Cron Jobs & Scheduling](#cron-jobs--scheduling)
5. [Email Preferences Mapping](#email-preferences-mapping)
6. [Monitoring & Best Practices](#monitoring--best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Email Types & User Preferences

### 3 Email Types Users Can Control

1. **Founder Updates** (`receiveFounderEmails`)
   - Personal updates from Hiro
   - Learning tips and user stories
   - 3-day welcome sequence for new users
   - Controlled by user in settings

2. **Product Updates** (`receiveProductUpdates`)
   - New features and improvements
   - Platform changes
   - Weekly digests, community stories, scenario inspiration
   - Controlled by user in settings

3. **Your Statistics** (`receiveProgressReports`)
   - Weekly practice stats
   - Progress insights
   - Controlled by user in settings

4. **Practice Reminders** (`receivePracticeReminders`)
   - Daily/weekly reminders to inactive users
   - Segmented by activity level
   - Controlled by user in settings

5. **Security Alerts** (`receiveSecurityAlerts`)
   - Critical account notifications
   - **ALWAYS ENABLED** (cannot be disabled)

---

## Setup Instructions

### 1. Configure Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add to your `.env` file:

```bash
# .env
RESEND_API_KEY=re_your_actual_key_here
CRON_SECRET=your_random_secret_for_cron_jobs
PUBLIC_APP_URL=https://trykaiwa.com
ENABLE_AUTOMATED_EMAILS=false  # Set to true when ready
```

4. Add to Fly.io secrets:

```bash
fly secrets set RESEND_API_KEY=re_your_actual_key_here
fly secrets set CRON_SECRET=your_random_secret
fly secrets set PUBLIC_APP_URL=https://trykaiwa.com
```

### 2. Verify Domain in Resend

1. Go to Resend dashboard → Domains
2. Add your domain (e.g., `trykaiwa.com`)
3. Add the DNS records they provide (SPF, DKIM, DMARC)
4. Wait for verification (usually <5 minutes)

**Important**: Until verified, emails will show "via resend.dev" which looks unprofessional.

### 3. Safety Mode

**ALL automated emails are disabled by default** until you set:

```bash
ENABLE_AUTOMATED_EMAILS=true
```

This prevents accidental email sends while testing. Use the testing methods below to preview and test emails without enabling automation.

---

## Testing Emails

### Quick Preview (No Database Required)

View the email HTML templates in your browser:

```bash
npx tsx scripts/preview-emails.ts
```

This generates HTML files you can open in a browser:
- `/tmp/reminder-email-preview.html` - Practice reminder email
- `/tmp/founder-day1-preview.html` - Day 1 founder email
- `/tmp/founder-day2-preview.html` - Day 2 founder email
- `/tmp/founder-day3-preview.html` - Day 3 founder email

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

---

## Cron Jobs & Scheduling

### Available Cron Endpoints

All endpoints support `?dryRun=true` and `?testEmails=email@example.com`:

#### 1. Practice Reminders Cron
- **File**: `src/routes/api/cron/send-reminders/+server.ts`
- **Schedule**: Mondays & Thursdays at 9:00 AM UTC
- **Preference Used**: `receivePracticeReminders`
- **Service**: `EmailReminderService.sendBulkReminders()`

```bash
curl -H "Authorization: Bearer development_secret" \
  http://localhost:5173/api/cron/send-reminders
```

#### 2. Founder Emails Cron
- **File**: `src/routes/api/cron/founder-emails/+server.ts`
- **Schedule**: Every afternoon (2-4 PM local time) - Daily
- **Preference Used**: `receiveFounderEmails`
- **Tracking**: `receivedFounderEmail` flag prevents resending

```bash
curl -H "Authorization: Bearer development_secret" \
  http://localhost:5173/api/cron/founder-emails
```

**3-Day Sequence:**
- **Day 1**: Warm welcome email (only for non-practicing users)
- **Day 2**: Check-in with offer of help
- **Day 3**: Personal offer to schedule a call

#### 3. Weekly Stats/Progress Reports Cron
- **File**: `src/routes/api/cron/weekly-stats/+server.ts`
- **Schedule**: Every Saturday at 11:00 AM UTC
- **Preference Used**: `receiveProgressReports`

```bash
curl -H "Authorization: Bearer development_secret" \
  http://localhost:5173/api/cron/weekly-stats
```

#### 4. Progress Reports Cron (Alternative)
- **File**: `src/routes/api/cron/progress-reports/+server.ts`
- **Schedule**: Saturdays at 9:00 AM UTC
- **Preference Used**: `receiveProgressReports`
- **Note**: May be duplicate of Weekly Stats (verify if both are needed)

```bash
curl -H "Authorization: Bearer development_secret" \
  http://localhost:5173/api/cron/progress-reports
```

#### 5. Product Updates Cron (Manual)
- **File**: `src/routes/api/cron/product-updates/+server.ts`
- **Schedule**: Manual (POST request to trigger)
- **Preference Used**: `receiveProductUpdates`

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

---

## Email Preferences Mapping

### Database Columns in `user_settings` Table

| Column Name | DB Column | Default | Purpose |
|---|---|---|---|
| `receivePracticeReminders` | `receive_practice_reminders` | `true` | Daily reminders to inactive users |
| `receiveFounderEmails` | `receive_founder_emails` | `true` | 3-day founder welcome sequence |
| `receiveProductUpdates` | `receive_product_updates` | `true` | Product announcements & features |
| `receiveProgressReports` | `receive_progress_reports` | `true` | Weekly practice statistics |
| `receiveSecurityAlerts` | `receive_security_alerts` | `true` | Security & account notifications |
| `receivedFounderEmail` | `received_founder_email` | `false` | Flag: founder email was already sent |
| `dailyReminderSentCount` | `daily_reminder_sent_count` | `0` | Counter for rate-limiting reminders |
| `lastReminderSentAt` | `last_reminder_sent_at` | `null` | Timestamp of last reminder sent |

### Preference-to-Cron Cross-Reference

#### `receivePracticeReminders`
- ✅ Send Reminders Cron (Mon & Thu)

#### `receiveFounderEmails`
- ✅ Founder Emails Cron (Daily)

#### `receiveProductUpdates`
- ✅ Weekly Digest (Sunday)
- ✅ Community Stories (Friday)
- ✅ Scenario Inspiration (Tuesday)
- ✅ Product Updates Manual (On-demand)

#### `receiveProgressReports`
- ✅ Weekly Stats (Saturday 11 AM)
- ✅ Progress Reports (Saturday 9 AM) - **Possible duplicate?**

#### `receiveSecurityAlerts`
- ❌ **NOT USED BY ANY CRON JOB YET**
- Reserved for future security notifications

### User Segmentation Logic

The system automatically segments users based on their last activity:

| Segment | Last Activity | Email Template | Frequency |
|---------|--------------|----------------|-----------|
| **New Users** | Never practiced | Welcome + Quick start guide | Once, after signup |
| **Recent Active** | <24 hours | ❌ No email (don't annoy them!) | N/A |
| **Slightly Inactive** | 1-3 days | Gentle reminder | Max 1/day |
| **Moderately Inactive** | 3-7 days | Motivation boost | Max 1/day |
| **Highly Inactive** | 7-30 days | Re-engagement | Max 1/day |
| **Dormant** | 30+ days | Win-back campaign | Final email |

---

## Monitoring & Best Practices

### Testing Email Preferences

#### Manual Testing
1. Go to `/profile?tab=email`
2. Toggle each preference
3. Check browser console (F12) for logs:
   - `Saving preferences: {...}`
   - `Save successful, server returned: {...}`
4. Verify debug box shows updated state

#### Database Verification
```sql
-- Check user's email preferences
SELECT userId, receivePracticeReminders, receiveFounderEmails,
       receiveProductUpdates, receiveProgressReports, receiveSecurityAlerts
FROM user_settings
WHERE userId = 'YOUR_USER_ID';
```

### Key Metrics to Track

1. **Open Rate**: Target >25%
2. **Click Rate**: Target >5%
3. **Conversion Rate** (email → conversation): Target >15%
4. **Unsubscribe Rate**: Keep <2%
5. **Re-engagement Rate** (inactive → active): Target >20%

### Rate Limiting & Best Practices

#### Resend Limits
- Free tier: 100 emails/day
- Paid tier: 50,000 emails/month ($20)

#### Our Rate Limits
- Max 1 reminder per user per 24 hours
- 100ms delay between emails (to avoid spam flags)
- Respect user preferences

#### Deliverability Best Practices
1. ✅ Authenticate domain (SPF, DKIM, DMARC)
2. ✅ Include unsubscribe link in every email
3. ✅ Use real "from" address (noreply@trykaiwa.com)
4. ✅ Personalize subject lines
5. ✅ Keep HTML clean (no complex CSS)
6. ✅ Test spam score before sending
7. ✅ Monitor bounce/complaint rates
8. ✅ Warm up sending (start slow, increase gradually)

---

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

### Emails going to spam
- ✅ Authenticate domain (SPF, DKIM, DMARC)
- ✅ Check spam score: [mail-tester.com](https://mail-tester.com)
- ✅ Warm up sending (start with 10-20 emails/day)
- ✅ Avoid spammy words ("free", "act now", excessive emojis)

### Cron job not running
- ✅ Check GitHub Actions logs (if using GH)
- ✅ Verify CRON_SECRET matches
- ✅ Test endpoint manually first
- ✅ Check Fly.io machine status

### High unsubscribe rate (>5%)
- ❌ Sending too frequently
- ❌ Content not valuable enough
- ❌ Wrong audience segmentation
- ✅ Survey users who unsubscribe
- ✅ A/B test email content

---

## Testing Checklist

Before going live:

- [ ] Test all email templates render correctly
- [ ] Verify links work (CTAs, unsubscribe, preferences)
- [ ] Check mobile rendering (80% of users read on mobile)
- [ ] Test with real email addresses (Gmail, Outlook, Apple Mail)
- [ ] Verify domain is authenticated in Resend
- [ ] Test cron job runs successfully
- [ ] Check rate limiting works (max 1 email/24h per user)
- [ ] Verify user preferences are respected
- [ ] Test unsubscribe flow
- [ ] Check error logging and monitoring
- [ ] Run `npx tsx scripts/preview-emails.ts` to view HTML templates
- [ ] Send test email to your own address
- [ ] Review dry run output for all cron jobs
- [ ] When ready: Set `ENABLE_AUTOMATED_EMAILS=true` in production

---

## Quick Reference

### Email System Architecture

```
User Signs Up
    ↓
User Settings Created (all preferences default to true)
    ↓
Cron Jobs Check Preferences Daily
    ↓
Email Service Respects Preferences
    ↓
Resend Sends Email
    ↓
User Can Update Preferences at /profile?tab=email
```

### Daily Schedule (UTC)

- **9:00 AM**: Practice Reminders (Mon & Thu)
- **9:00 AM**: Progress Reports (Saturday)
- **10:00 AM**: Community Stories (Friday)
- **10:00 AM**: Scenario Inspiration (Tuesday)
- **10:00 AM**: Weekly Digest (Sunday)
- **11:00 AM**: Weekly Stats (Saturday)
- **2-4 PM**: Founder Emails (Daily, localized)

### Implementation Checklist for Changes

- [ ] Identify which crons to consolidate/change
- [ ] Create migration if adding new preference columns
- [ ] Update `user-settings.ts` schema
- [ ] Update `user-settings.repository.ts` to include new preferences
- [ ] Update `EmailPermissionService` with new methods
- [ ] Update `EmailPreferences.svelte` component UI
- [ ] Update cron endpoints to use new preferences
- [ ] Create email templates for any new email types
- [ ] Test cron jobs locally with dry-run mode
- [ ] Deploy and monitor first execution

---

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [GitHub Actions Cron Syntax](https://crontab.guru/)
- [Email Deliverability Guide](https://postmarkapp.com/guides/everything-about-dmarc)
- [Transactional Email Best Practices](https://www.twilio.com/blog/transactional-email-best-practices)

---

**Last Updated**: January 2025
