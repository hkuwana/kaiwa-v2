# 🚀 Quick Start: Founder Personal Emails

**Goal**: Get personal emails running in 30 minutes

---

## ✅ Step-by-Step Setup

### 1. Set Up Cal.com (5 minutes)

1. Go to [cal.com](https://cal.com) and sign up (free)
2. Click "Event Types" → "New Event Type"
3. Configure:
   - **Name**: Quick Chat with Hiro
   - **Duration**: 15 minutes
   - **Location**: Google Meet (or Zoom)
   - **Buffer**: 10 minutes between calls
   - **Questions**: "What would you like to discuss about Kaiwa?"
4. Copy your link (looks like: `cal.com/hiro-kaiwa/15min`)
5. Update in code:

```bash
# Edit src/lib/server/services/founder-email.service.ts
# Find this line:
private static readonly CAL_LINK = 'https://cal.com/hiro-kaiwa/15min';
# Replace with your actual Cal.com link
```

### 2. Configure Resend (5 minutes)

You already have Resend set up, but verify:

```bash
# Check your .env file has:
RESEND_API_KEY=re_your_key_here
CRON_SECRET=your_random_secret

# Check Resend dashboard:
# - Domain is verified (kaiwa.fly.dev)
# - You can send from hiro@kaiwa.app
```

### 3. Deploy Code (5 minutes)

```bash
# Add founder email service files (already created):
git add src/lib/server/services/founder-email.service.ts
git add src/routes/api/cron/founder-emails/+server.ts
git commit -m "Add founder personal email sequence"
git push

# Deploy to Fly.io
fly deploy
```

### 4. Test Locally (5 minutes)

```bash
# Start dev server
pnpm dev

# In another terminal, test Day 1 email with your own user ID:
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id-here"}' \
  http://localhost:5173/api/cron/founder-emails

# Check your email inbox!
```

### 5. Set Up GitHub Action (10 minutes)

Create `.github/workflows/founder-emails.yml`:

```yaml
name: Send Founder Emails
on:
  schedule:
    # Run daily at 2pm UTC (adjust for your target timezone)
    # 2pm UTC = 6am PST, 9am EST, 11pm JST
    - cron: '0 14 * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  send-emails:
    runs-on: ubuntu-latest
    steps:
      - name: Send founder emails
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://kaiwa.fly.dev/api/cron/founder-emails
```

Then:

```bash
# Add to git
git add .github/workflows/founder-emails.yml
git commit -m "Add daily founder email cron job"
git push

# Add secret to GitHub:
# 1. Go to GitHub repo → Settings → Secrets and variables → Actions
# 2. Click "New repository secret"
# 3. Name: CRON_SECRET
# 4. Value: (same value from your .env file)
# 5. Click "Add secret"

# Test manually:
# Go to GitHub → Actions → "Send Founder Emails" → "Run workflow"
```

---

## 🧪 Testing Before Going Live

### Test the Sequence

```bash
# Test Day 1 email (welcome)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id"}' \
  https://kaiwa.fly.dev/api/cron/founder-emails

# Wait 10 seconds, check your email

# Test with a friend's user ID (get their permission first!)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId": "friend-user-id"}' \
  https://kaiwa.fly.dev/api/cron/founder-emails
```

### Verify Emails Look Good

- [ ] Open email on desktop (Gmail, Outlook)
- [ ] Open email on mobile (iPhone Mail, Gmail app)
- [ ] Click "Start Conversation" button - does it work?
- [ ] Click Cal.com link (Day 3) - does it open?
- [ ] Hit "Reply" - does it go to hiro@kaiwa.app?
- [ ] Check spam folder - if emails go there, see troubleshooting below

---

## 🚨 Troubleshooting

### Emails Not Sending

```bash
# Check Fly.io logs
fly logs --app kaiwa

# Look for errors like:
# "Failed to send Day 1 email: Domain not verified"
# "RESEND_API_KEY not configured"

# Verify secrets are set:
fly secrets list

# Should show:
# NAME                  VALUE
# RESEND_API_KEY       re_...
# CRON_SECRET          ...
```

### Emails Going to Spam

1. **Verify domain in Resend**:
   - Go to Resend dashboard → Domains
   - Check that kaiwa.fly.dev has green checkmark
   - If not, add DNS records (SPF, DKIM, DMARC)

2. **Test spam score**:
   - Send email to [mail-tester.com](https://www.mail-tester.com)
   - Check score (should be 8/10 or higher)

3. **Warm up sending**:
   - Start with 5-10 emails per day
   - Gradually increase over 1-2 weeks

### Cron Not Running

```bash
# Check GitHub Actions logs:
# Go to GitHub → Actions → Click on latest run → Check output

# Common issues:
# - CRON_SECRET not set in GitHub → Add it in repo settings
# - Wrong URL in curl command → Should be https://kaiwa.fly.dev
# - Timezone confusion → Check cron expression at crontab.guru
```

---

## 📊 Monitor Results

### First Week

Track these numbers:

| Day | Signups | Day 1 Sent | Day 2 Sent | Day 3 Sent | Replies | Conversions |
| --- | ------- | ---------- | ---------- | ---------- | ------- | ----------- |
| Mon | 5       | 0          | 0          | 0          | 0       | 0           |
| Tue | 3       | 5          | 0          | 0          | 1       | 2           |
| Wed | 4       | 3          | 5          | 0          | 2       | 3           |
| Thu | 6       | 4          | 3          | 5          | 3       | 5           |
| ... | ...     | ...        | ...        | ...        | ...     | ...         |

**Good signs**:

- ✅ Day 1 open rate >40%
- ✅ At least 1 reply per 10 emails
- ✅ 20-30% conversion to first conversation
- ✅ 1-2 Cal.com bookings per week

**Bad signs**:

- ❌ Open rate &lt;20% (emails in spam?)
- ❌ Zero replies after 50 emails (too impersonal?)
- ❌ &lt;5% conversion (onboarding broken?)

### Resend Dashboard

Check daily:

- **Emails sent**: Should match number of eligible users
- **Delivery rate**: Should be >99%
- **Bounce rate**: Should be &lt;2%
- **Open rate**: Track over time

### PostHog (optional)

Add tracking to know which emails convert:

```typescript
// In +server.ts, after sending email:
posthog.capture('founder_email_sent', {
	emailType: 'day1_welcome',
	userId: user.id,
	daysSinceSignup: 1
});

// In conversation page, when user starts:
posthog.capture('conversation_started', {
	source: 'founder_email', // if they came from email link
	userId: user.id
});
```

---

## 💬 Handling Replies (Most Important!)

### Set Up Email Forwarding

If you want to reply from a different email:

1. In Gmail, set up "Send mail as" for hiro@kaiwa.app
2. Or use Resend's reply-to feature (already configured)

### Reply Templates

Keep these handy:

**General help**:

```
Hey [Name]!

Thanks for reaching out. [Answer their specific question]

If you're still stuck, want to hop on a quick call? Here's my
calendar: [cal.com link]

Or if you prefer, I can send you a quick video walkthrough.
Just let me know!

Hiro
```

**Feature request**:

```
Hey [Name],

Great suggestion! I'm adding this to the roadmap. Can you tell
me more about your use case? Would love to understand how you'd
use this feature.

In the meantime, here's a workaround that might help: [...]

Thanks for the feedback!

Hiro
```

**Bug report**:

```
Hey [Name],

Oh no! Thanks for catching this. Can you send me:
1. What browser you're using?
2. Screenshot if possible?
3. What were you trying to do when it broke?

I'll get this fixed ASAP and ping you when it's deployed.

Sorry for the trouble!

Hiro
```

---

## 📈 Week 1 Goals

- [ ] Send Day 1 email to all users who signed up 24h ago
- [ ] Get at least 3 replies
- [ ] Convert 10+ signups → first conversation
- [ ] Book 1 Cal.com call
- [ ] Fix any onboarding issues discovered from replies

---

## 🎯 Success Metrics

**After 30 days**, you should see:

| Metric                          | Target | Excellent |
| ------------------------------- | ------ | --------- |
| **Total emails sent**           | 200+   | 500+      |
| **Reply rate**                  | 5%     | 15%       |
| **Conversion rate**             | 25%    | 40%       |
| **Cal.com bookings**            | 5      | 15        |
| **Routine users** (3+ sessions) | 30     | 60        |

**If you hit these numbers**, you've proven:

1. ✅ People want this product
2. ✅ Personal touch works
3. ✅ You're building real relationships
4. ✅ Ready to scale to 1000 users

---

## 🚀 What's Next?

Once you have 50+ active users from personal emails:

1. **Analyze feedback**: What onboarding issues came up most?
2. **Fix top 3 issues**: Makes future emails more effective
3. **Create FAQ**: Put common questions on website
4. **Refine email copy**: A/B test subject lines
5. **Scale**: Keep personal emails, add automated sequences

---

## ✅ Final Checklist

Before going live:

- [ ] Cal.com account set up with 15-min event
- [ ] Cal.com link added to Day 3 email template
- [ ] Tested all 3 emails with your own account
- [ ] GitHub Action deployed and tested
- [ ] CRON_SECRET added to GitHub secrets
- [ ] Resend domain verified (SPF, DKIM, DMARC)
- [ ] Reply-to configured (hiro@kaiwa.app)
- [ ] Mobile email rendering checked
- [ ] Ready to respond to replies within 4 hours

**You're ready to go! 🎉**

---

## 📞 Need Help?

- Check full strategy: [FOUNDER_EMAIL_STRATEGY.md](FOUNDER_EMAIL_STRATEGY.md)
- Email setup guide: [EMAIL_REMINDER_SETUP.md](EMAIL_REMINDER_SETUP.md)
- Questions? Open an issue or email support@kaiwa.app

**Now go build those relationships!** 💪
