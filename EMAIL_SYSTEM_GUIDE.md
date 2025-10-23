# 📧 Kaiwa Email System - Complete Guide

## Overview

Kaiwa's email system is designed for **solo founders** who want professional, scalable email automation without the complexity. Everything respects user preferences and is built to scale from 10 to 10,000+ users.

---

## 📊 Email Types & Organization

### 1. Marketing Emails (Automated)

**What**: 3-day founder welcome sequence
**Who manages**: You write once, automated forever
**Cron**: Daily at 2pm UTC
**Script**: `scripts/send-founder-emails.ts`
**Test**: `pnpm cron:founder-emails`

**When it sends**:

- Day 1 after signup: Welcome email
- Day 2 after signup: Check-in email
- Day 3 after signup: Personal offer to chat

**Your effort**: Already done! Just monitor logs occasionally.

---

### 2. Daily Reminders (Automated)

**What**: Practice reminders for inactive users
**Who manages**: Fully automated
**Cron**: Daily at 9am UTC
**Script**: `scripts/send-reminders.ts`
**Test**: `pnpm cron:reminders`

**When it sends**:

- To users who haven't practiced in 24+ hours
- Respects rate limits (max 1/day per user)
- Automatically tracks reminder count

**Your effort**: Zero! Just monitor logs.

---

### 3. Weekly Digest (NEW - Semi-Automated) ⭐

**What**: Weekly summary of progress + what shipped at Kaiwa
**Who manages**: You update content weekly (5-10 min)
**Cron**: Mondays at 10am UTC
**Script**: `scripts/send-weekly-digest.ts`
**Test**: `pnpm cron:weekly-digest`

**Your Weekly Workflow** (Sundays):

1. Visit <https://trykaiwa.com/dev/weekly-digest>
2. Fill in 2-4 bullets of what shipped this week
3. Add any highlights or upcoming features
4. Click "Copy to Script"
5. Paste into `scripts/send-weekly-digest.ts`
6. Commit and push (cron picks it up Monday)

**Time**: 5-10 minutes per week

**Calendar Reminder**: Import `kaiwa-founder-reminders.ics` into your calendar!

---

### 4. Product Updates (Manual - Coming Soon)

**What**: Major announcements, big feature launches
**Who manages**: You, manually when needed
**Frequency**: Ad-hoc (2-4 times per year)
**Script**: To be created
**Test**: To be created

**When to use**:

- Major new feature (e.g., "Mobile app is live!")
- Important changes (e.g., pricing updates)
- Big milestones (e.g., "10,000 users!")

**Your effort**: 15-30 minutes when you have news (rare)

---

### 5. Security Alerts (Event-Triggered - Coming Soon)

**What**: Password changes, new device logins, payment issues
**Who manages**: Fully automated, event-triggered
**When**: Immediately when event happens
**Script**: To be created in `email-security.service.ts`

**Triggers**:

- Password changed
- New device login
- Payment failed
- Suspicious activity

**Your effort**: Write once, automatic forever

---

## 🗓️ Calendar Integration

**Import your founder reminders:**

1. Open [kaiwa-founder-reminders.ics](./kaiwa-founder-reminders.ics)
2. Import into Google Calendar, Apple Calendar, or Outlook
3. Get reminded to:
   - Update weekly digest (Sundays 3pm UTC)
   - Check weekly digest sent (Mondays 11am UTC)
   - Monitor email stats (Daily)
   - Plan product updates (Monthly)
   - Weekly system health check (Fridays 6pm UTC)

**All reminders include**:

- Step-by-step instructions
- Estimated time needed
- Links to relevant dashboards

---

## 🎯 Quick Reference

### Test Locally (Before Deploying)

```bash
# Test daily reminders
pnpm cron:reminders

# Test founder emails
pnpm cron:founder-emails

# Test weekly digest
pnpm cron:weekly-digest
```

### Deploy All Cron Jobs

```bash
# Deploy all 3 cron jobs to Fly.io
pnpm cron:deploy

# Or manually
./scripts/deploy-cron-jobs.sh
```

### Check Status

```bash
# List all cron machines
fly machines list | grep cron

# Expected output:
# cron-daily-reminders    stopped  (runs at 9am UTC)
# cron-founder-emails     stopped  (runs at 2pm UTC)
# cron-weekly-digest      stopped  (runs Mon 10am UTC)

# View logs
fly logs | grep "cron-"

# View Resend dashboard
open https://resend.com/emails
```

### Update Weekly Digest Content

**Option 1: Admin UI (Recommended)**

1. Visit <https://trykaiwa.com/dev/weekly-digest>
2. Fill in content
3. Click "Copy to Script"
4. Paste into `scripts/send-weekly-digest.ts`

**Option 2: Edit Script Directly**

1. Open `scripts/send-weekly-digest.ts`
2. Update `THIS_WEEKS_CONTENT` object
3. Save and commit

---

## 📈 Monitoring Dashboard

### Daily Checks (1-2 minutes)

```bash
# Quick health check
fly logs | grep "cron-" | tail -20

# Check Resend for delivery issues
open https://resend.com/emails
```

### Weekly Deep Dive (5-10 minutes)

**Fridays at 6pm UTC** (calendar reminder set):

1. **Resend Dashboard**: Check delivery/bounce/complaint rates
2. **Fly Machines**: Verify all 3 cron jobs exist
3. **Recent Logs**: Look for errors or failures
4. **Action Items**: Fix any bounces, investigate complaints

---

## 🚀 Scaling Guide

### Current Setup (Good for 0-10,000 users)

- Sequential processing (~100ms per email)
- ~10 emails/second
- 1,000 users = ~2 minutes total
- Fits in Fly.io free tier

### When to Optimize (10,000+ users)

**Phase 1: Batch Processing**

```typescript
// Process 50 users at a time in parallel
const batches = chunk(users, 50);
for (const batch of batches) {
	await Promise.all(batch.map((user) => sendEmail(user)));
}
```

**Phase 2: Queue-Based (Upstash QStash)**

```typescript
// Offload to queue for massive scale
for (const user of users) {
	await qstash.publishJSON({
		url: 'https://trykaiwa.com/api/email/send',
		body: { userId: user.id }
	});
}
```

**You won't need this for a while!** Current setup handles 10K users easily.

---

## 🛠️ Troubleshooting

### Weekly Digest Not Sending

**Check 1: Is cron machine created?**

```bash
fly machines list | grep weekly-digest
```

If not found → Run `pnpm cron:deploy`

**Check 2: Is content updated?**

```bash
# Open script and verify THIS_WEEKS_CONTENT has real data
code scripts/send-weekly-digest.ts
```

**Check 3: Test locally**

```bash
pnpm cron:weekly-digest
```

### No Users Receiving Emails

**Check 1: User preferences**

```bash
# Check if users have opted in
psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_settings WHERE receive_weekly_digest = true"
```

**Check 2: RESEND_API_KEY set?**

```bash
fly secrets list | grep RESEND
```

**Check 3: Resend dashboard**

- Go to <https://resend.com/emails>
- Check for delivery errors, bounces

### Cron Job Not Running on Schedule

**Check 1: Machine status**

```bash
fly machine status <machine-id>
```

**Check 2: Update schedule if needed**

```bash
fly machine update <machine-id> --schedule daily --schedule-time "10:00"
```

**Check 3: Manually trigger for testing**

```bash
fly ssh console
pnpm cron:weekly-digest
```

---

## 📚 File Structure

```
kaiwa/
├── scripts/
│   ├── send-reminders.ts           # Daily reminders cron
│   ├── send-founder-emails.ts      # Founder sequence cron
│   ├── send-weekly-digest.ts       # Weekly digest cron ⭐ NEW
│   └── deploy-cron-jobs.sh         # Deploy all crons
│
├── src/routes/dev/weekly-digest/
│   └── +page.svelte                # Admin UI for digest ⭐ NEW
│
├── src/routes/api/admin/weekly-digest/
│   ├── preview/+server.ts          # Preview API ⭐ NEW
│   └── send/+server.ts             # Send API ⭐ NEW
│
├── src/lib/server/email/
│   ├── email-reminder.service.ts   # Reminder service
│   ├── founder-email.service.ts    # Founder sequence
│   ├── weekly-updates-email.service.ts  # Weekly digest service
│   └── email-permission.service.ts # Permission checks
│
├── kaiwa-founder-reminders.ics     # Calendar file ⭐ NEW
├── EMAIL_SYSTEM_GUIDE.md           # This file ⭐ NEW
└── CRON_SETUP_SUMMARY.md           # Cron architecture docs
```

---

## ✅ Next Steps

### This Week

1. ✅ **Import calendar reminders**: Open `kaiwa-founder-reminders.ics`
2. ✅ **Test weekly digest locally**: Run `pnpm cron:weekly-digest`
3. ✅ **Update first digest content**: Visit `/dev/weekly-digest`
4. ✅ **Deploy weekly digest cron**: Run `pnpm cron:deploy`

### Next Week

1. Monitor weekly digest delivery (Monday logs)
2. Adjust content based on user feedback
3. Check Resend dashboard for issues

### Next Month

1. Consider building product update script
2. Consider adding security alert triggers
3. Review email analytics (open rates, etc.)

---

## 🎓 Pro Tips for Solo Founders

1. **Start simple**: You have 3 automated emails. That's enough!
2. **Monitor weekly**: Friday health checks catch issues early
3. **Respect preferences**: Your system already does this perfectly
4. **Keep it personal**: Weekly digest is from you, not marketing@
5. **Don't over-engineer**: Manual product updates are fine at your scale
6. **Use calendar**: Import the .ics file so you never forget
7. **Test locally first**: Always run `pnpm cron:*` before deploying

---

## 📞 Support

**Questions about the system?**

- Read: [CRON_SETUP_SUMMARY.md](./CRON_SETUP_SUMMARY.md)
- Read: [architecture-cron-jobs.md](./src/lib/docs/architecture-cron-jobs.md)

**Cron jobs not working?**

- Check logs: `fly logs | grep cron`
- Test locally: `pnpm cron:weekly-digest`

**Need help?**

- Fly.io docs: <https://fly.io/docs/machines/>
- Resend docs: <https://resend.com/docs>

---

**Status**: ✅ Ready to use
**Last updated**: January 2025
**Version**: 1.0 (Weekly Digest Edition)
