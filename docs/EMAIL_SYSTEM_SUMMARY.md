# Email System: Complete Guide & Migration Plan

> **TL;DR**: Reorganize your scattered email files into a unified dashboard. Go from curl commands to clicking buttons. Takes 2 hours.

## 📚 Documentation Index

### Start Here

**👉 [Email Quick Start](./2-guides/email-quick-start.md)** ← Read this first
- 10-minute version (just test what you have)
- 2-hour version (full migration + dashboard)
- Your first day using the dashboard
- Troubleshooting quick reference

### Core Documentation

**[Email System Architecture](./2-guides/email-system-architecture.md)**
- How the new system works
- Layer-by-layer explanation
- File organization
- Extension points

**[Email System Migration](./2-guides/email-system-migration.md)**
- Complete step-by-step migration plan
- 5 phases with time estimates
- Before/after comparison
- Success metrics

**[Email Testing Guide](./2-guides/email-testing-guide.md)**
- How to test emails safely
- Dry run vs actual send
- Preview without database

**[Kit Migration Guide](./2-guides/email-kit-migration.md)**
- When to migrate from Resend to Kit
- Cost comparison
- Decision framework
- **Recommendation**: Wait until 100+ users

---

## 🎯 What Problem Does This Solve?

### Current State (Before)

**Problems**:
- ❌ Email files scattered across multiple directories
- ❌ No visibility into what emails exist or when they send
- ❌ Testing requires writing curl commands
- ❌ Previewing emails requires running scripts
- ❌ Hard to find specific email code
- ❌ Each email configured separately in GitHub Actions

**Example workflow**:
```bash
# Want to preview the reminder email?
1. Find the service file (search for 5 min)
2. Read the code to understand it
3. Write a test script
4. Run script locally
5. Check output
Total time: 10-15 minutes
```

### Future State (After)

**Solutions**:
- ✅ All email code in `src/lib/emails/campaigns/`
- ✅ Single dashboard at `/dev/email` shows everything
- ✅ Click "Preview" to see any email instantly
- ✅ Click "Test" to send to yourself
- ✅ Clear organization by campaign
- ✅ Central config file for all campaigns

**Example workflow**:
```bash
# Want to preview the reminder email?
1. Visit /dev/email
2. Click "Preview" button
Total time: 5 seconds
```

**10x improvement in developer productivity**

---

## 🗺️ Migration Path

### Option 1: Fast Track (2 hours)

```bash
# 1. Run automated migration
npx tsx scripts/migrate-email-files.ts

# 2. Build dashboard (copy from docs)
# See: email-system-architecture.md

# 3. Test locally
pnpm dev
open http://localhost:5173/dev/email

# 4. Deploy
git commit -m "feat: unified email dashboard"
fly deploy
```

**Total time**: 2 hours
**Difficulty**: Easy (mostly copy-paste)

### Option 2: Manual Migration (4-6 hours)

Follow the detailed guide in [Email System Migration](./2-guides/email-system-migration.md).

**When to use**: If automated script fails or you want to understand every step.

### Option 3: Do Nothing (Stay Current)

**Keep current system if**:
- You're comfortable with curl commands
- You only have 2-3 emails
- You rarely change email templates
- You don't mind the scattered files

**But note**: As you add more emails, this becomes harder to maintain.

---

## 📁 New File Structure

### Before (Scattered)
```
src/lib/server/email/
├── email-reminder.service.ts
├── founder-email.service.ts
├── weekly-stats-email.service.ts
├── product-updates-email.service.ts
├── scenario-inspiration-email.service.ts
├── community-story-email.service.ts
├── progress-reports-email.service.ts
├── weekly-updates-email.service.ts
└── email-send-guard.service.ts
```

### After (Organized)
```
src/lib/emails/
├── campaigns/                        # All email campaigns
│   ├── reminders/
│   │   ├── reminder.service.ts      # Business logic
│   │   ├── reminder.template.ts     # HTML template
│   │   └── reminder.config.ts       # Settings
│   ├── founder-sequence/
│   │   ├── founder.service.ts
│   │   ├── day-1.template.ts
│   │   ├── day-2.template.ts
│   │   └── day-3.template.ts
│   ├── weekly-stats/
│   ├── product-updates/
│   └── ...
│
├── shared/                           # Shared utilities
│   ├── email-sender.ts
│   ├── email-guard.ts
│   └── email-permission.ts
│
└── email-campaigns.config.ts         # Central config
```

**Benefits**:
- Easy to find: "Where's the reminder email?" → `campaigns/reminders/`
- Organized: Template, service, config all in one place
- Scalable: Add new campaigns without cluttering

---

## 🎨 Dashboard Features

### Email Command Center (`/dev/email`)

**Table View**:
```
┌────────────┬──────────────┬────────────┬──────────┐
│ Campaign   │ Next Send    │ Status     │ Actions  │
├────────────┼──────────────┼────────────┼──────────┤
│ Reminders  │ Fri 9:00 AM  │ 🟢 Active  │ [Preview]│
│            │ (in 2 days)  │            │ [Test]   │
├────────────┼──────────────┼────────────┼──────────┤
│ Weekly     │ Mon 10:00 AM │ ⏰ Scheduled│ [Preview]│
│ Stats      │ (in 5 days)  │            │ [Test]   │
└────────────┴──────────────┴────────────┴──────────┘
```

**Preview Panel**:
- Live preview of email HTML
- See exactly what users receive
- Updates instantly as you edit

**Test Controls**:
- Enter your email address
- Click "Send Test"
- Receive email in seconds
- Dry run mode (see what would happen without sending)

---

## 🔄 Workflow Comparison

### Previewing an Email

**Before**:
```bash
1. Find email service file (where is it?)
2. Read the code
3. Write test script or curl command
4. Run it
5. Check output
Time: 10 minutes
```

**After**:
```bash
1. Visit /dev/email
2. Click "Preview"
Time: 5 seconds
```

### Testing an Email

**Before**:
```bash
1. Write curl command with auth
2. Add test email parameter
3. Execute command
4. Check for errors
5. Check inbox
Time: 5 minutes
```

**After**:
```bash
1. Enter email in dashboard
2. Click "Send Test"
3. Check inbox
Time: 30 seconds
```

### Finding Email Code

**Before**:
```bash
1. Search codebase: "email reminder"
2. Find service file
3. Where's the template?
4. Where's the config?
Time: 5 minutes
```

**After**:
```bash
1. Go to: src/lib/emails/campaigns/reminders/
2. All files in one place
Time: 5 seconds
```

---

## 💰 When to Adopt Kit (ConvertKit)

### Decision Matrix

| Your Situation | Recommendation |
|----------------|---------------|
| < 50 users | ❌ **Don't use Kit** - Waste of $25/month |
| 50-100 users | ⚠️ **Maybe** - Only if hiring marketer |
| 100-300 users | ✅ **Consider it** - Visual builder, drip campaigns |
| 300+ users | ✅✅ **Yes** - Advanced features worth the cost |

### Cost Comparison at Your Scale

**Current (12 users)**:
- Resend: $0/month (under 3K emails)
- Kit: $0/month (if you don't use it)
- **Total: $0/month**

**At 100 users**:
- Resend only: $0/month
- Resend + Kit: $25/month
- **ROI**: Only worth it if you save 2+ hours/month

**At 500 users**:
- Resend only: $20/month
- Resend + Kit: $33/month (Kit does marketing, Resend does transactional)
- **ROI**: Definitely worth it (drip campaigns, landing pages, analytics)

### When Kit Makes Sense

**Use Kit when you**:
- ✅ Have 100+ users
- ✅ Want visual email builder (non-technical editing)
- ✅ Need drip campaigns (Day 1, 3, 7, 14 sequences)
- ✅ Want landing pages (saves $30-50/month on other tools)
- ✅ Hire a marketer (non-technical team member)

**Stick with Resend when you**:
- ✅ Have < 100 users
- ✅ Your emails are data-driven (personalized stats)
- ✅ You're technical and like coding
- ✅ You want maximum control

**Recommendation for Kaiwa**: Wait until 100 users (likely 2-3 months at current growth).

---

## ✅ Action Plan

### This Week: Migration

**Day 1** (2 hours):
```bash
# Morning: Run migration
npx tsx scripts/migrate-email-files.ts
pnpm check  # Fix any errors

# Afternoon: Build dashboard
# Copy code from docs/2-guides/email-system-architecture.md
mkdir -p src/routes/dev/email
# ... create files

# Evening: Test locally
pnpm dev
open http://localhost:5173/dev/email
```

**Day 2** (1 hour):
```bash
# Deploy to production
git add .
git commit -m "feat: unified email dashboard"
git push
fly deploy

# Verify production
open https://trykaiwa.com/dev/email
```

**Day 3-7**: Use dashboard daily, get comfortable with new system

### This Month: Optimize

**Week 2**:
- Review email analytics in Resend dashboard
- A/B test one subject line
- Adjust timing based on open rates

**Week 3-4**:
- Add new campaign if needed (using organized structure)
- Optimize templates based on user feedback
- Monitor GitHub Actions for reliability

### Month 2-3: Consider Kit

**At 50 users**:
- Review Kit migration guide
- Evaluate if you need visual builder
- Calculate ROI

**At 100 users**:
- Strongly consider Kit
- Set up trial
- Migrate weekly digest first

---

## 📊 Success Metrics

### Developer Productivity (Before → After)

| Task | Before | After | Improvement |
|------|--------|-------|-------------|
| Preview email | 10 min | 5 sec | **120x faster** |
| Test email | 5 min | 30 sec | **10x faster** |
| Find email code | 5 min | 5 sec | **60x faster** |
| Add new campaign | 1 hour | 15 min | **4x faster** |

### System Visibility (Before → After)

| Question | Before | After |
|----------|--------|-------|
| What emails do we send? | Search codebase | See dashboard table |
| When do they send? | Check GitHub Actions | See "Next Send" column |
| How many recipients? | Run DB query | See dashboard |
| Is it working? | Check logs manually | Dashboard status indicators |

---

## 🔗 Quick Links

### Documentation
- [Quick Start](./2-guides/email-quick-start.md) - Start here
- [Architecture](./2-guides/email-system-architecture.md) - How it works
- [Migration Guide](./2-guides/email-system-migration.md) - Step-by-step
- [Testing Guide](./2-guides/email-testing-guide.md) - Test safely
- [Kit Guide](./2-guides/email-kit-migration.md) - When to use Kit

### Code
- [Migration Script](../scripts/migrate-email-files.ts) - Automated migration
- [Central Config](../src/lib/emails/email-campaigns.config.ts) - After migration
- [Cron Jobs](./1-core/cron-jobs.md) - How scheduling works

---

## 🎯 Recommendation

**For your current stage (12 users)**:

1. ✅ **This week**: Migrate to new structure (2 hours investment)
2. ✅ **This month**: Use dashboard daily, optimize based on data
3. ⏰ **At 100 users**: Revisit Kit migration guide
4. ❌ **Don't use Kit now**: Waste of $25/month at your scale

**ROI**: 2 hours now saves 10+ hours/month going forward.

---

## 🆘 Getting Help

### Common Issues

**Migration script fails**:
- See manual migration steps in [Migration Guide](./2-guides/email-system-migration.md)
- Check git status (are files already moved?)

**Dashboard shows 404**:
- Verify file exists: `ls src/routes/dev/email/+page.svelte`
- Restart dev server: `pnpm dev`

**Preview is blank**:
- Check browser console for errors
- Verify template exports function
- Check import path in config

**Emails not sending**:
- Check RESEND_API_KEY is set
- Verify user email preferences
- Check Resend dashboard for errors

### Still Stuck?

1. Read [Quick Start](./2-guides/email-quick-start.md)
2. Check [Architecture](./2-guides/email-system-architecture.md)
3. Review [Migration Guide](./2-guides/email-system-migration.md)
4. Check GitHub Actions logs
5. Check Resend dashboard

---

**Last Updated**: 2025-11-21
**Status**: Ready to migrate
**Estimated Time**: 2 hours for full migration
**Next Review**: At 100 users (Kit decision)
