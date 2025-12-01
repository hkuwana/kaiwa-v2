# Email System Migration Guide

> **Goal**: Reorganize scattered email files into a unified, maintainable system with a single dashboard for all email operations.

## 📋 Migration Overview

### Current Problems

❌ **Scattered files**: Email services spread across multiple directories
❌ **No visibility**: Can't see what emails are scheduled or when
❌ **Hard to test**: Requires curl commands and manual testing
❌ **Difficult to find**: Email code mixed with other server code
❌ **No central config**: Each email has its own schedule in GitHub Actions

### After Migration

✅ **One dashboard**: `/dev/email` for all email operations
✅ **Full visibility**: See all campaigns, schedules, next send times
✅ **Click to test**: Preview and send test emails instantly
✅ **Easy to find**: All email code in `src/lib/emails/campaigns/`
✅ **Central config**: Single source of truth for all email campaigns

---

## 🗺️ Migration Phases

### Phase 1: Preparation (30 min)

**Goals**:

- Create new directory structure
- Set up central configuration
- No breaking changes yet

**Steps**:

1. **Create new directories**:

   ```bash
   mkdir -p src/lib/emails/campaigns
   mkdir -p src/lib/emails/shared
   mkdir -p src/lib/emails/templates
   ```

2. **Create central config**:

   ```bash
   touch src/lib/emails/email-campaigns.config.ts
   ```

3. **Install dependencies**:

   ```bash
   npm install cron-parser
   ```

4. **Verify structure**:
   ```bash
   tree src/lib/emails
   # Should show:
   # src/lib/emails/
   # ├── campaigns/
   # ├── shared/
   # ├── templates/
   # └── email-campaigns.config.ts
   ```

---

### Phase 2: File Reorganization (1-2 hours)

**Goals**:

- Move email files to new structure
- Preserve git history
- Update imports

**Current → New Mapping**:

```
OLD LOCATION                                          NEW LOCATION
────────────────────────────────────────────────────────────────────────────────
src/lib/server/email/email-reminder.service.ts    → src/lib/emails/campaigns/reminders/
                                                      ├── reminder.service.ts
                                                      ├── reminder.template.ts
                                                      └── reminder.config.ts

src/lib/server/email/founder-email.service.ts     → src/lib/emails/campaigns/founder-sequence/
                                                      ├── founder.service.ts
                                                      ├── day-1.template.ts
                                                      ├── day-2.template.ts
                                                      ├── day-3.template.ts
                                                      └── founder.config.ts

src/lib/server/email/weekly-stats-email.service.ts → src/lib/emails/campaigns/weekly-stats/
                                                      ├── stats.service.ts
                                                      ├── stats.template.ts
                                                      └── stats.config.ts

src/lib/server/email/product-updates-email.service.ts → src/lib/emails/campaigns/product-updates/
                                                         ├── update.service.ts
                                                         ├── update.template.ts
                                                         └── update.config.ts

src/lib/server/email/scenario-inspiration-email.service.ts → src/lib/emails/campaigns/scenario-inspiration/
                                                               ├── inspiration.service.ts
                                                               ├── inspiration.template.ts
                                                               └── inspiration.config.ts

src/lib/server/email/community-story-email.service.ts → src/lib/emails/campaigns/community-stories/
                                                          ├── story.service.ts
                                                          ├── story.template.ts
                                                          └── story.config.ts

src/lib/server/email/progress-reports-email.service.ts → src/lib/emails/campaigns/progress-reports/
                                                           ├── progress.service.ts
                                                           ├── progress.template.ts
                                                           └── progress.config.ts

src/lib/server/email/weekly-updates-email.service.ts → src/lib/emails/campaigns/weekly-digest/
                                                         ├── digest.service.ts
                                                         ├── digest.template.ts
                                                         └── digest.config.ts

# Shared utilities
src/lib/server/email/email-send-guard.service.ts  → src/lib/emails/shared/email-guard.ts
src/lib/server/email/email-permission.service.ts  → src/lib/emails/shared/email-permission.ts
src/lib/server/services/email-service.ts          → src/lib/emails/shared/email-sender.ts
```

**Migration Script**:

See `scripts/migrate-email-files.ts` for automated migration.

**Manual Steps**:

```bash
# For each file, use git mv to preserve history
git mv src/lib/server/email/email-reminder.service.ts \
       src/lib/emails/campaigns/reminders/reminder.service.ts

# Create template files (split from service)
touch src/lib/emails/campaigns/reminders/reminder.template.ts

# Create config files
touch src/lib/emails/campaigns/reminders/reminder.config.ts

# Repeat for all campaigns...
```

**Update Imports**:

Search and replace across codebase:

```typescript
// OLD
import { emailReminderService } from '$lib/server/email/email-reminder.service';

// NEW
import { reminderService } from '$lib/emails/campaigns/reminders/reminder.service';
```

**Verify**:

```bash
# Search for old imports
grep -r "lib/server/email" src/

# Should return no results
```

---

### Phase 3: Dashboard Development (2-3 hours)

**Goals**:

- Build `/dev/email` dashboard
- Add preview functionality
- Add test send functionality

**Steps**:

1. **Create dashboard page**:

   ```bash
   mkdir -p src/routes/dev/email
   touch src/routes/dev/email/+page.svelte
   touch src/routes/dev/email/+page.server.ts
   ```

2. **Create API endpoints**:

   ```bash
   mkdir -p src/routes/api/dev/email
   touch src/routes/api/dev/email/campaigns/+server.ts
   touch src/routes/api/dev/email/preview/[campaign]/+server.ts
   touch src/routes/api/dev/email/test/+server.ts
   ```

3. **Implement dashboard** (see code below)

4. **Test locally**:
   ```bash
   pnpm dev
   # Visit http://localhost:5173/dev/email
   ```

---

### Phase 4: Testing & Validation (1 hour)

**Checklist**:

- [ ] All email campaigns visible in dashboard
- [ ] Preview works for each campaign
- [ ] Test send works (dry run)
- [ ] Test send works (actual send to your email)
- [ ] Next send times calculated correctly
- [ ] Cron endpoints still work
- [ ] GitHub Actions still trigger correctly

**Test Commands**:

```bash
# Test each campaign preview
curl http://localhost:5173/api/dev/email/preview/reminders
curl http://localhost:5173/api/dev/email/preview/founder-sequence
curl http://localhost:5173/api/dev/email/preview/weekly-stats

# Test dry run
curl -X POST http://localhost:5173/api/dev/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "campaign": "reminders",
    "testEmail": "your@email.com",
    "dryRun": true
  }'

# Test actual send
curl -X POST http://localhost:5173/api/dev/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "campaign": "reminders",
    "testEmail": "your@email.com",
    "dryRun": false
  }'
```

---

### Phase 5: Deployment (30 min)

**Steps**:

1. **Commit changes**:

   ```bash
   git add .
   git commit -m "Reorganize email system with unified dashboard"
   ```

2. **Push to GitHub**:

   ```bash
   git push origin main
   ```

3. **Deploy to Fly.io**:

   ```bash
   fly deploy
   ```

4. **Verify production**:

   ```bash
   # Visit production dashboard
   open https://trykaiwa.com/dev/email

   # Test one campaign
   curl https://trykaiwa.com/api/dev/email/preview/reminders
   ```

5. **Monitor GitHub Actions**:
   - Go to Actions tab
   - Verify cron jobs still run on schedule
   - Check logs for any import errors

---

## 📁 Final Directory Structure

```
src/lib/emails/
├── campaigns/                           # All email campaigns
│   ├── reminders/
│   │   ├── reminder.service.ts         # Business logic
│   │   ├── reminder.template.ts        # HTML template
│   │   └── reminder.config.ts          # Campaign-specific config
│   ├── founder-sequence/
│   │   ├── founder.service.ts
│   │   ├── day-1.template.ts
│   │   ├── day-2.template.ts
│   │   ├── day-3.template.ts
│   │   └── founder.config.ts
│   ├── weekly-stats/
│   │   ├── stats.service.ts
│   │   ├── stats.template.ts
│   │   └── stats.config.ts
│   ├── product-updates/
│   │   ├── update.service.ts
│   │   ├── update.template.ts
│   │   └── update.config.ts
│   ├── scenario-inspiration/
│   │   ├── inspiration.service.ts
│   │   ├── inspiration.template.ts
│   │   └── inspiration.config.ts
│   ├── community-stories/
│   │   ├── story.service.ts
│   │   ├── story.template.ts
│   │   └── story.config.ts
│   ├── progress-reports/
│   │   ├── progress.service.ts
│   │   ├── progress.template.ts
│   │   └── progress.config.ts
│   └── weekly-digest/
│       ├── digest.service.ts
│       ├── digest.template.ts
│       └── digest.config.ts
│
├── shared/                              # Shared utilities
│   ├── email-sender.ts                 # Resend wrapper
│   ├── email-guard.ts                  # Send permission checks
│   ├── email-permission.ts             # User preferences
│   └── email-scheduler.ts              # Cron utilities
│
├── templates/                           # Base templates
│   ├── base-email.template.ts          # Base HTML structure
│   └── components.ts                   # Reusable email components
│
├── email-campaigns.config.ts           # Central configuration
└── index.ts                             # Exports
```

---

## 🔧 Post-Migration Improvements

### Optional Enhancements

**1. Add Email Analytics** (Later):

```typescript
// Track opens and clicks
src / lib / emails / shared / email - analytics.ts;
```

**2. Add A/B Testing** (Later):

```typescript
// Test subject lines
src / lib / emails / shared / email - ab - testing.ts;
```

**3. Add Template Builder** (Later):

```svelte
<!-- Visual email builder -->
src/routes/dev/email/builder/+page.svelte
```

---

## 🐛 Troubleshooting

### Import Errors After Migration

**Problem**: `Cannot find module '$lib/server/email/...'`

**Solution**:

```bash
# Search for old imports
grep -r "lib/server/email" src/

# Update to new paths
# OLD: import { x } from '$lib/server/email/email-reminder.service'
# NEW: import { x } from '$lib/emails/campaigns/reminders/reminder.service'
```

### Dashboard Not Loading

**Problem**: `/dev/email` shows 404

**Solution**:

```bash
# Verify route exists
ls src/routes/dev/email/+page.svelte

# Restart dev server
pnpm dev
```

### Preview Returns Blank

**Problem**: Email preview is empty

**Solution**:

```bash
# Check template path in config
# Verify template exports a function
# Check for console errors
```

---

## ✅ Migration Checklist

### Pre-Migration

- [ ] Backup current email files
- [ ] Review current email functionality
- [ ] Understand current cron schedules
- [ ] Have test email address ready

### Phase 1: Preparation

- [ ] Create new directory structure
- [ ] Install cron-parser
- [ ] Create central config file

### Phase 2: Reorganization

- [ ] Move all service files
- [ ] Split templates from services
- [ ] Create config files for each campaign
- [ ] Update all imports
- [ ] Test that nothing broke

### Phase 3: Dashboard

- [ ] Build `/dev/email` page
- [ ] Create API endpoints
- [ ] Add preview functionality
- [ ] Add test send functionality

### Phase 4: Testing

- [ ] Test preview for all campaigns
- [ ] Test dry run for all campaigns
- [ ] Test actual send to yourself
- [ ] Verify cron endpoints still work

### Phase 5: Deployment

- [ ] Commit and push
- [ ] Deploy to production
- [ ] Verify production dashboard
- [ ] Monitor GitHub Actions

### Post-Migration

- [ ] Update team documentation
- [ ] Train team on new dashboard
- [ ] Delete old email files
- [ ] Archive migration docs

---

## 📊 Success Metrics

**Before Migration**:

- Time to preview email: 5-10 min (write test script)
- Time to test send: 3-5 min (curl command)
- Time to find email code: 2-3 min (search multiple dirs)
- Visibility into schedules: None (check GitHub Actions)

**After Migration**:

- Time to preview email: 5 seconds (click button)
- Time to test send: 10 seconds (click button)
- Time to find email code: 5 seconds (organized by campaign)
- Visibility into schedules: Complete (dashboard shows all)

**Goal**: 10x improvement in developer productivity for email operations.

---

## 🔗 Related Documentation

- [Email System Architecture](./email-system-architecture.md) - New architecture overview
- [Email Dashboard Guide](./email-dashboard-guide.md) - How to use dashboard
- [Kit Migration Guide](./email-kit-migration.md) - When and how to adopt Kit
- [Email Testing Guide](./email-testing-guide.md) - Testing best practices

---

**Last Updated**: 2025-11-21
**Status**: Migration in progress
**Estimated Completion**: 1 day
