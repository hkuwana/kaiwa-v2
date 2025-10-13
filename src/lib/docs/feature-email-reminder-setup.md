# 📧 Email Reminder System Setup Guide

## Overview

Kaiwa uses **Resend** for sending reminder emails that come directly from Hiro. This guide covers setup, testing, and automation.

---

## 🎯 Why Email Reminders Matter

Your problem: **100 visitors but low routine usage**

**Solution**: Thoughtful founder emails that:

1. ✅ Personally welcome new users and encourage their first five-minute conversation
2. ✅ Gently nudge anyone who hasn’t practiced yet (tone: “seems like you haven’t had a chance”)
3. ✅ Offer a 15-minute check-in once they’ve been quiet for a few days
4. ✅ Send a single daily reminder (when opted in) that suggests scenarios, shares a safety phrase, and keeps the tone human—no gamified streaks

**Expected Impact**:

- New user → First conversation: +40%
- Inactive → Re-engagement: +25%
- Routine usage (3+ sessions): +50%

---

## 🔧 Setup Instructions

### 1. Configure Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add to your `.env` file:

```bash
# .env
RESEND_API_KEY=re_your_actual_key_here
CRON_SECRET=your_random_secret_for_cron_jobs
PUBLIC_APP_URL=https://trykaiwa.com
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
3. Add the DNS records they provide
4. Wait for verification (usually &lt;5 minutes)

**Important**: Until verified, emails will show "via resend.dev" which looks unprofessional.

### 3. Test Email Sending

Run this to test your setup:

```bash
curl -X GET \
  -H "Authorization: Bearer your_cron_secret" \
  http://localhost:5173/api/cron/send-reminders
```

Or in production:

```bash
curl -X GET \
  -H "Authorization: Bearer your_cron_secret" \
  https://trykaiwa.com/api/cron/send-reminders
```

Expected response:

```json
{
	"success": true,
	"stats": {
		"total": 10,
		"sent": 8,
		"skipped": 2,
		"failed": 0,
		"segments": {
			"newUsers": 3,
			"slightlyInactive": 2,
			"moderatelyInactive": 2,
			"highlyInactive": 1,
			"dormant": 0
		}
	}
}
```

---

## ⚙️ Automation Options

### Option 1: Fly.io Machines (Recommended)

**Pros**: Built-in, no external dependencies, free tier
**Cons**: Requires Fly.io setup

Create `fly.toml` entry:

```toml
[experimental]
  auto_rollback = true

[[services]]
  internal_port = 8080
  protocol = "tcp"

# Add this section for scheduled tasks
[[vm]]
  size = "shared-cpu-1x"

[deploy]
  strategy = "rolling"

[metrics]
  port = 9091
  path = "/metrics"
```

Then create a machine for cron:

```bash
# Create a cron machine that runs daily at 9am UTC
fly machine run \
  --schedule "0 9 * * *" \
  --entrypoint "curl -X GET -H 'Authorization: Bearer $CRON_SECRET' https://trykaiwa.com/api/cron/send-reminders"
```

### Option 2: GitHub Actions (Easy)

**Pros**: Free, easy to set up, reliable
**Cons**: Requires GitHub repo

Create `.github/workflows/daily-reminders.yml`:

```yaml
name: Send Daily Reminders
on:
  schedule:
    # Runs daily at 9am UTC (1am PST, 4am EST, 6pm JST)
    - cron: '0 9 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send reminder emails
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://trykaiwa.com/api/cron/send-reminders
```

**Setup**:

1. Go to GitHub repo → Settings → Secrets
2. Add `CRON_SECRET` secret
3. Commit the workflow file
4. Test with "Run workflow" button

### Option 3: EasyCron / Cron-job.org (External)

**Pros**: Dedicated cron service, monitoring included
**Cons**: Another service to manage, may have limits

1. Sign up at [cron-job.org](https://cron-job.org) (free)
2. Create new cron job:
   - URL: `https://trykaiwa.com/api/cron/send-reminders`
   - Schedule: Daily at 9:00 AM
   - Headers: `Authorization: Bearer your_cron_secret`
3. Enable notifications for failures

### Option 4: Upstash QStash (Serverless)

**Pros**: Serverless, automatic retries, great logging
**Cons**: Requires Upstash account

```bash
# Install QStash CLI
npm install -g @upstash/cli

# Create scheduled job
qstash schedule create \
  --url "https://trykaiwa.com/api/cron/send-reminders" \
  --cron "0 9 * * *" \
  --header "Authorization: Bearer your_cron_secret"
```

---

## 📊 User Segmentation Logic

The system automatically segments users based on their last activity:

| Segment                 | Last Activity   | Email Template                  | Frequency          |
| ----------------------- | --------------- | ------------------------------- | ------------------ |
| **New Users**           | Never practiced | Welcome + Quick start guide     | Once, after signup |
| **Recent Active**       | &lt;24 hours    | ❌ No email (don't annoy them!) | N/A                |
| **Slightly Inactive**   | 1-3 days        | Gentle reminder                 | Max 1/day          |
| **Moderately Inactive** | 3-7 days        | Motivation boost                | Max 1/day          |
| **Highly Inactive**     | 7-30 days       | Re-engagement                   | Max 1/day          |
| **Dormant**             | 30+ days        | Win-back campaign               | Final email        |

---

## 🎨 Email Templates

### New User Email

**Subject**: `[Name], ready for your first conversation? 🎯`

**Content**:

- Welcome message
- Quick start guide
- Featured scenarios
- No-pressure CTA: "Start My First Conversation"

### Slightly Inactive (1-3 days)

**Subject**: `Miss you already! Ready to practice today? 💪`

**Content**:

- Gentle nudge
- Reminder of progress
- Quick motivation: "Even 5 minutes helps"
- CTA: "Continue Practicing"

### Moderately Inactive (3-7 days)

**Subject**: `Don't let your progress fade! Come back? 🌟`

**Content**:

- Acknowledge busy life
- Remind of invested time
- Address common objections
- CTA: "Let's Get Back to It"

### Highly Inactive (7-30 days)

**Subject**: `We miss you! Here's what's new 🎁`

**Content**:

- Show what's new
- Ask for feedback: "What would make Kaiwa better?"
- Empathetic tone
- CTA: "Give Kaiwa Another Try"

### Dormant (30+ days)

**Subject**: `Last chance: Your Kaiwa account is still here 🌸`

**Content**:

- No guilt-trip, honest tone
- "Do you still want to learn [Language]?"
- Last chance message
- Easy unsubscribe
- CTA: "One More Conversation"

---

## 🔒 User Privacy & Preferences

### Email Preferences Page

Create `/profile/email-preferences` route:

```typescript
// src/routes/profile/email-preferences/+page.svelte
<script lang="ts">
  import { userSettingsStore } from '$lib/stores/user-settings.store.svelte';

  let receiveReminders = $state(userSettingsStore.receiveDailyReminderEmails);
  let receiveMarketing = $state(userSettingsStore.receiveMarketingEmails);

  async function updatePreferences() {
    await fetch('/api/user/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        receiveDailyReminderEmails: receiveReminders,
        receiveMarketingEmails: receiveMarketing
      })
    });
  }
</script>

<div class="container">
  <h1>Email Preferences</h1>

  <label>
    <input type="checkbox" bind:checked={receiveReminders}>
    Daily practice reminders
  </label>

  <label>
    <input type="checkbox" bind:checked={receiveMarketing}>
    Product updates and tips
  </label>

  <button onclick={updatePreferences}>Save Preferences</button>

  <p>
    <a href="/profile/unsubscribe">Unsubscribe from all emails</a>
  </p>
</div>
```

### Unsubscribe Flow

Every email must include:

```html
<a href="https://trykaiwa.com/profile/email-preferences"> Manage email preferences </a>
```

---

## 📈 Monitoring & Analytics

### Track Email Performance

Add PostHog events:

```typescript
// When email is sent
posthog.capture('email_sent', {
	segment: 'slightly_inactive',
	userId: user.id,
	emailType: 'practice_reminder'
});

// When user clicks email link
posthog.capture('email_clicked', {
	segment: 'slightly_inactive',
	userId: user.id,
	emailType: 'practice_reminder'
});

// When user starts conversation from email
posthog.capture('email_conversion', {
	segment: 'slightly_inactive',
	userId: user.id,
	emailType: 'practice_reminder'
});
```

### Key Metrics to Track

1. **Open Rate**: Target >25%
2. **Click Rate**: Target >5%
3. **Conversion Rate** (email → conversation): Target >15%
4. **Unsubscribe Rate**: Keep &lt;2%
5. **Re-engagement Rate** (inactive → active): Target >20%

### Resend Dashboard

Monitor in Resend:

- Delivery rate (should be >99%)
- Bounce rate (keep &lt;2%)
- Complaint rate (keep &lt;0.1%)

---

## 🧪 Testing Checklist

Before going live:

- [ ] Test all 5 email templates render correctly
- [ ] Verify links work (CTAs, unsubscribe, preferences)
- [ ] Check mobile rendering (80% of users read on mobile)
- [ ] Test with real email addresses (Gmail, Outlook, Apple Mail)
- [ ] Verify domain is authenticated in Resend
- [ ] Test cron job runs successfully
- [ ] Check rate limiting works (max 1 email/24h per user)
- [ ] Verify user preferences are respected
- [ ] Test unsubscribe flow
- [ ] Check error logging and monitoring

---

## 🚨 Rate Limiting & Best Practices

### Resend Limits

- Free tier: 100 emails/day
- Paid tier: 50,000 emails/month ($20)

### Our Rate Limits

- Max 1 reminder per user per 24 hours
- 100ms delay between emails (to avoid spam flags)
- Respect user preferences (check `receiveDailyReminderEmails`)

### Deliverability Best Practices

1. ✅ Authenticate domain (SPF, DKIM, DMARC)
2. ✅ Include unsubscribe link in every email
3. ✅ Use real "from" address (<noreply@trykaiwa.com>)
4. ✅ Personalize subject lines
5. ✅ Keep HTML clean (no complex CSS)
6. ✅ Test spam score before sending
7. ✅ Monitor bounce/complaint rates
8. ✅ Warm up sending (start slow, increase gradually)

---

## 🎯 Quick Start (TL;DR)

1. **Get Resend API key**: [resend.com](https://resend.com) → Dashboard → API Keys
2. **Add to Fly secrets**:

   ```bash
   fly secrets set RESEND_API_KEY=re_...
   fly secrets set CRON_SECRET=random_secret
   ```

3. **Set up GitHub Action** (easiest):
   - Copy workflow file from Option 2 above
   - Add `CRON_SECRET` to GitHub secrets
   - Done!
4. **Test manually**:

   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" \
     https://trykaiwa.com/api/cron/send-reminders
   ```

5. **Monitor** in Resend dashboard and PostHog

---

## 🆘 Troubleshooting

### Emails not sending

- ✅ Check RESEND_API_KEY is set correctly
- ✅ Verify domain is authenticated in Resend
- ✅ Check user has `emailVerified = true`
- ✅ Check user has `receiveDailyReminderEmails = true`
- ✅ Look for errors in Fly logs: `fly logs`

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

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [GitHub Actions Cron Syntax](https://crontab.guru/)
- [Email Deliverability Guide](https://postmarkapp.com/guides/everything-about-dmarc)
- [Transactional Email Best Practices](https://www.twilio.com/blog/transactional-email-best-practices)

---

## 🔄 Next Steps

1. ✅ Set up Resend account and verify domain
2. ✅ Add API keys to Fly secrets
3. ✅ Deploy code with email endpoints
4. ✅ Set up GitHub Action for daily cron
5. ✅ Test with small group (5-10 users)
6. ✅ Monitor metrics for 1 week
7. ✅ Adjust templates based on feedback
8. ✅ Scale to all users

---

**Questions?** Email <hiro@trykaiwa.com> or open an issue on GitHub.

**Last updated**: January 2025
