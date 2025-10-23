# 📧 Kaiwa Email System - At a Glance

## Email Types Overview

| Email Type          | Frequency       | Automation         | Your Time       | Status    |
| ------------------- | --------------- | ------------------ | --------------- | --------- |
| **Daily Reminders** | Daily 9am UTC   | ✅ Fully Automated | 0 min/week      | ✅ Live   |
| **Founder Emails**  | Daily 2pm UTC   | ✅ Fully Automated | 0 min/week      | ✅ Live   |
| **Weekly Digest**   | Mon 10am UTC    | 🔄 Semi-Automated  | 5-10 min/week   | ✅ Live   |
| **Product Updates** | Ad-hoc          | 📝 Manual          | 15-30 min/event | ⏳ Future |
| **Security Alerts** | Event-triggered | ✅ Fully Automated | 0 min/week      | ⏳ Future |

---

## Your Weekly Time Commitment

**Total: ~10-15 minutes per week**

- **Sunday (5-10 min)**: Update weekly digest content
- **Monday (2 min)**: Check digest sent successfully
- **Friday (5 min)**: Quick health check

**Daily automation handles the rest!**

---

## File Locations

### Scripts (Cron Jobs)

```
scripts/send-reminders.ts         - Daily reminders
scripts/send-founder-emails.ts    - Founder sequence
scripts/send-weekly-digest.ts     - Weekly digest ⭐ NEW
scripts/deploy-cron-jobs.sh       - Deploy all
```

### Admin Pages

```
/dev/weekly-digest               - Update digest content ⭐ NEW
```

### Services

```
src/lib/server/email/
  ├── email-reminder.service.ts
  ├── founder-email.service.ts
  ├── weekly-updates-email.service.ts
  └── email-permission.service.ts
```

---

## Quick Commands

### Test Locally

```bash
pnpm cron:reminders         # Test daily reminders
pnpm cron:founder-emails    # Test founder sequence
pnpm cron:weekly-digest     # Test weekly digest
```

### Deploy

```bash
pnpm cron:deploy           # Deploy all cron jobs
```

### Monitor

```bash
fly logs | grep "cron-"    # View cron logs
fly machines list          # List cron machines
```

---

## User Preferences Respected

All emails respect these preferences:

✅ **Marketing Emails** → Founder sequence
✅ **Daily Reminders** → Practice reminders
✅ **Product Updates** → Future product announcements
✅ **Weekly Digest** → Weekly summary
✅ **Security Alerts** → Security notifications

Users can manage at: `/profile` → Email Preferences

---

## Calendar Integration

**Import**: `kaiwa-founder-reminders.ics`

**Reminders**:

- Sunday 3pm UTC: Update weekly digest
- Monday 11am UTC: Check digest sent
- Daily: Check founder/reminder stats
- Friday 6pm UTC: Weekly health check
- Monthly: Consider product updates

---

## Architecture

```
Fly.io App: kaiwa
├── Web Process (main app)
├── Cron: daily-reminders (9am UTC)
├── Cron: founder-emails (2pm UTC)
└── Cron: weekly-digest (Mon 10am UTC) ⭐ NEW
```

**Benefits**:

- ✅ Isolated from main app
- ✅ Reliable scheduling
- ✅ Separate logs
- ✅ Free (Fly.io tier)

---

## Monitoring Checklist

### Daily (1-2 min)

- [ ] Check logs: `fly logs | grep "cron-"`
- [ ] Verify no errors

### Weekly (5-10 min)

- [ ] Update weekly digest (Sunday)
- [ ] Check digest sent (Monday)
- [ ] Resend dashboard health check (Friday)

### Monthly (5 min)

- [ ] Review overall email stats
- [ ] Consider product update email
- [ ] Update email content if needed

---

## Next Steps

1. ✅ Import calendar: `kaiwa-founder-reminders.ics`
2. ✅ Test weekly digest: `pnpm cron:weekly-digest`
3. ✅ Update first content: Visit `/dev/weekly-digest`
4. ✅ Deploy cron: `pnpm cron:deploy`
5. ⏳ Monitor Monday: Check logs for success

---

## Resources

📖 **Full Guide**: [EMAIL_SYSTEM_GUIDE.md](./EMAIL_SYSTEM_GUIDE.md)
🚀 **Quick Start**: [WEEKLY_DIGEST_QUICKSTART.md](./WEEKLY_DIGEST_QUICKSTART.md)
🏗️ **Architecture**: [CRON_SETUP_SUMMARY.md](./CRON_SETUP_SUMMARY.md)

---

**Questions?** Check the guides above or test locally first!
