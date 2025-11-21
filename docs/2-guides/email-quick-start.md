# Email System Quick Start

> **Fast track**: Get your email system reorganized and dashboard running in under 2 hours.

## 🚀 Quick Start Path

### For Immediate Use (10 minutes)

**Just want to see what you have?**

1. Visit your current email testing guide:

   ```bash
   cat docs/2-guides/email-testing-guide.md
   ```

2. Test an email right now:

   ```bash
   curl http://localhost:5173/api/cron/send-reminders?dryRun=true
   ```

3. Done! You now know what emails you have.

---

### For Dashboard (2 hours)

**Want the `/dev/email` dashboard?**

Follow this exact sequence:

#### Step 1: Run Migration Script (30 min)

```bash
# 1. Make sure you're on a clean branch
git status

# 2. Create migration branch
git checkout -b email-system-migration

# 3. Run automated migration
npx tsx scripts/migrate-email-files.ts

# 4. Review what changed
git status
cat migration-report.md

# 5. Fix any TypeScript errors
pnpm check
```

**If migration script fails**: See [Manual Migration](#manual-migration-fallback) below.

#### Step 2: Create Dashboard (45 min)

```bash
# 1. Create dashboard page
mkdir -p src/routes/dev/email
```

Copy code from `docs/2-guides/email-system-architecture.md` section "Dashboard Implementation" into:

- `src/routes/dev/email/+page.svelte`

```bash
# 2. Create API endpoints
mkdir -p src/routes/api/dev/email/campaigns
mkdir -p src/routes/api/dev/email/preview
mkdir -p src/routes/api/dev/email/test
```

Copy code from architecture doc into each endpoint.

```bash
# 3. Create central config
touch src/lib/emails/email-campaigns.config.ts
```

Copy config from architecture doc.

```bash
# 4. Install dependencies
npm install cron-parser
```

#### Step 3: Test Locally (15 min)

```bash
# 1. Start dev server
pnpm dev

# 2. Visit dashboard
open http://localhost:5173/dev/email

# 3. Try preview button
# Click "Preview" on any campaign

# 4. Try test send
# Enter your email, click "Send Test"
```

#### Step 4: Deploy (30 min)

```bash
# 1. Commit changes
git add .
git commit -m "feat: unified email dashboard with campaign structure"

# 2. Push to GitHub
git push origin email-system-migration

# 3. Create PR and merge
# Or push directly to main if you prefer

# 4. Deploy to Fly.io
fly deploy

# 5. Verify production
open https://trykaiwa.com/dev/email
```

**Total time**: ~2 hours

---

## 📋 What You Get

### Before Migration

**Email operations**:

```bash
# Want to preview an email?
1. Find the service file (where is it?)
2. Read the code
3. Write a test script
4. Run it
5. Check output
Time: 10-15 minutes
```

**File organization**:

```
src/lib/server/email/
├── email-reminder.service.ts      (where is the template?)
├── founder-email.service.ts       (where is the schedule?)
├── weekly-stats-email.service.ts  (how many of these are there?)
└── ... scattered everywhere
```

### After Migration

**Email operations**:

```bash
# Want to preview an email?
1. Visit /dev/email
2. Click "Preview"
Time: 5 seconds
```

**File organization**:

```
src/lib/emails/campaigns/
├── reminders/
│   ├── reminder.service.ts    (logic)
│   ├── reminder.template.ts   (HTML)
│   └── reminder.config.ts     (settings)
├── founder-sequence/
│   ├── founder.service.ts
│   ├── day-1.template.ts
│   └── founder.config.ts
└── ... organized by campaign
```

---

## 🎯 Your First Day Using Dashboard

### Morning: Review All Campaigns

1. Visit `/dev/email`
2. See table of all campaigns
3. Note which ones are scheduled
4. Check next send times

**What you'll learn**:

- What emails are automated
- When they send
- How many recipients

### Midday: Test One Campaign

1. Click "Preview" on Practice Reminders
2. See exactly what users receive
3. Click "Test Send"
4. Enter your email
5. Check your inbox

**What you'll learn**:

- What emails look like
- How to test before deploying

### Afternoon: Make Your First Change

1. Find the campaign in filesystem:

   ```bash
   # It's organized, easy to find!
   open src/lib/emails/campaigns/reminders/reminder.template.ts
   ```

2. Edit the template
3. Save
4. Preview in dashboard (instant update)
5. Test send to yourself
6. Deploy when happy

**What you'll learn**:

- How fast iteration is now
- How organized everything is

---

## 🔧 Daily Workflow

### Check Dashboard Daily (30 seconds)

```bash
# Quick glance at email health
curl https://trykaiwa.com/dev/email/health

# Or visit dashboard
open https://trykaiwa.com/dev/email
```

**Look for**:

- ✅ All campaigns show "Active"
- ✅ Next send times are correct
- ⚠️ Any campaigns showing errors

### Before Deploying Email Changes (2 min)

```bash
# 1. Preview locally
Visit: http://localhost:5173/dev/email
Click: Preview button

# 2. Test send
Enter your email
Click: Send Test

# 3. Check inbox
Verify it looks good

# 4. Deploy
git push
fly deploy
```

### Weekly: Review Email Analytics (5 min)

```bash
# Check Resend dashboard
open https://resend.com/emails

# Look for:
- Open rates
- Click rates
- Bounces
- Unsubscribes
```

---

## 🆘 Troubleshooting Quick Reference

### Dashboard shows 404

**Problem**: `/dev/email` not found

**Fix**:

```bash
# Verify file exists
ls src/routes/dev/email/+page.svelte

# If missing, create it
mkdir -p src/routes/dev/email
# Copy code from docs/2-guides/email-system-architecture.md
```

### Preview shows blank

**Problem**: Email preview is empty

**Fix**:

```bash
# Check browser console for errors
# Common issue: template import failed

# Verify template exists
ls src/lib/emails/campaigns/reminders/reminder.template.ts

# Check it exports a function
grep "export" src/lib/emails/campaigns/reminders/reminder.template.ts
```

### Test send fails

**Problem**: "Error sending email"

**Fix**:

```bash
# Check Resend API key
echo $RESEND_API_KEY

# If empty, set it
fly secrets set RESEND_API_KEY=re_your_key_here

# Test manually
curl -X POST https://trykaiwa.com/api/dev/email/test \
  -H "Content-Type: application/json" \
  -d '{"campaign":"reminders","testEmail":"your@email.com","dryRun":false}'
```

### GitHub Actions not triggering

**Problem**: Cron jobs stopped running

**Fix**:

```bash
# Check GitHub Actions
open https://github.com/YOUR_USERNAME/kaiwa/actions

# Is workflow enabled? If not, enable it

# Check CRON_SECRET
fly secrets list | grep CRON
# Should match GitHub secret

# Manually trigger to test
# Go to Actions > Run workflow
```

---

## 📚 Next Steps After Quick Start

### Week 1: Learn the System

- [ ] Read [Email System Architecture](./email-system-architecture.md)
- [ ] Understand campaign structure
- [ ] Test preview for all campaigns
- [ ] Send test emails to yourself

### Week 2: Make First Changes

- [ ] Edit one email template
- [ ] Test changes via dashboard
- [ ] Deploy to production
- [ ] Monitor for issues

### Month 1: Optimize

- [ ] Review email analytics
- [ ] A/B test subject lines
- [ ] Adjust schedules based on data
- [ ] Add new campaign if needed

### Month 2-3: Consider Kit

- [ ] Review [Kit Migration Guide](./email-kit-migration.md)
- [ ] Wait until 100+ users
- [ ] Evaluate if you need it
- [ ] Plan migration if yes

---

## 🎓 Learning Resources

### Documentation (Read in Order)

1. **This guide** - Quick start (you are here)
2. [Email System Architecture](./email-system-architecture.md) - How it works
3. [Email System Migration](./email-system-migration.md) - Detailed migration steps
4. [Email Testing Guide](./email-testing-guide.md) - Testing strategies
5. [Email Kit Migration](./email-kit-migration.md) - When to use Kit

### Code Examples

**Simple template**:

```typescript
// src/lib/emails/campaigns/example/example.template.ts
export function exampleTemplate(data: { userName: string }) {
	return `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Hi ${data.userName}!</h1>
        <p>This is a simple email.</p>
      </body>
    </html>
  `;
}
```

**Simple service**:

```typescript
// src/lib/emails/campaigns/example/example.service.ts
import { exampleTemplate } from './example.template';
import { sendEmail } from '$lib/emails/shared/email-sender';

export async function sendExample(userName: string, email: string) {
	const html = exampleTemplate({ userName });

	await sendEmail({
		to: email,
		subject: 'Example Email',
		html
	});
}
```

---

## ✅ Quick Start Checklist

### Pre-Migration

- [ ] Read this guide
- [ ] Understand current email system
- [ ] Have 30 min - 2 hours available

### Migration

- [ ] Run migration script
- [ ] Fix TypeScript errors
- [ ] Create dashboard page
- [ ] Create API endpoints
- [ ] Install dependencies

### Testing

- [ ] Visit `/dev/email` locally
- [ ] Preview all campaigns
- [ ] Test send to yourself
- [ ] Verify cron endpoints work

### Deployment

- [ ] Commit changes
- [ ] Push to GitHub
- [ ] Deploy to Fly.io
- [ ] Verify production dashboard

### Post-Deployment

- [ ] Use dashboard daily
- [ ] Monitor GitHub Actions
- [ ] Review email analytics weekly
- [ ] Consider Kit at 100+ users

---

## 🎉 You're Done!

Congrats! You now have:

- ✅ Organized email system
- ✅ Beautiful dashboard at `/dev/email`
- ✅ Click-to-preview any email
- ✅ Click-to-test any email
- ✅ Clear file organization
- ✅ Automated scheduling via GitHub Actions

**What's next?**

- Use the dashboard daily
- Read architecture docs
- Optimize based on data
- Consider Kit at 100+ users

---

**Questions?** See [Email System Architecture](./email-system-architecture.md) for deep dive.

**Last Updated**: 2025-11-21
