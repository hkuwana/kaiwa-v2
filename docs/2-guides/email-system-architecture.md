# Email System Architecture

> **Overview**: Unified email system with centralized dashboard, organized campaigns, and automated scheduling.

## 🎯 Design Principles

### Single Source of Truth

**Central Configuration**: `src/lib/emails/email-campaigns.config.ts`
- All campaigns defined in one place
- Schedules, templates, endpoints all configured here
- Dashboard reads from this config automatically

### Separation of Concerns

```
Template   → What the email looks like (HTML)
Service    → Business logic (who gets it, when, why)
Config     → Scheduling and metadata
Dashboard  → Developer interface
```

### Developer Experience

**Before**:
```
Want to preview an email?
→ Write a test script
→ Run it locally
→ Check HTML output
→ 5-10 minutes
```

**After**:
```
Want to preview an email?
→ Visit /dev/email
→ Click "Preview"
→ See it instantly
→ 5 seconds
```

---

## 🏗️ Architecture Layers

### Layer 1: Templates (Presentation)

**Location**: `src/lib/emails/campaigns/[campaign]/[campaign].template.ts`

**Purpose**: Pure HTML generation

**Example**:
```typescript
// src/lib/emails/campaigns/reminders/reminder.template.ts
export function reminderTemplate(data: {
  userName: string;
  lastPracticed: Date;
  nextScenario: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Hi ${data.userName}!</h1>
        <p>It's been ${daysSince(data.lastPracticed)} days since you practiced.</p>
        <p>Try this next: ${data.nextScenario}</p>
      </body>
    </html>
  `;
}
```

**Rules**:
- ✅ Pure function (no side effects)
- ✅ Takes data, returns HTML
- ✅ No database access
- ✅ No API calls
- ✅ Easily testable

---

### Layer 2: Services (Business Logic)

**Location**: `src/lib/emails/campaigns/[campaign]/[campaign].service.ts`

**Purpose**: Who gets the email and why

**Example**:
```typescript
// src/lib/emails/campaigns/reminders/reminder.service.ts
import { reminderTemplate } from './reminder.template';
import { db } from '$lib/server/db';
import { sendEmail } from '$lib/emails/shared/email-sender';

export async function sendPracticeReminders() {
  // Business logic: Who should receive this?
  const users = await db.query.users.findMany({
    where: and(
      eq(users.receiveReminders, true),
      lt(users.lastPracticed, sevenDaysAgo())
    )
  });

  // Send to each user
  for (const user of users) {
    const html = reminderTemplate({
      userName: user.firstName,
      lastPracticed: user.lastPracticed,
      nextScenario: await getSuggestedScenario(user)
    });

    await sendEmail({
      to: user.email,
      subject: 'Time to practice! 🎯',
      html
    });
  }

  return { sent: users.length };
}
```

**Rules**:
- ✅ Contains business logic
- ✅ Database queries allowed
- ✅ Calls template for HTML
- ✅ Calls email-sender to send
- ❌ No HTML generation here

---

### Layer 3: Configuration (Metadata)

**Location**: `src/lib/emails/email-campaigns.config.ts`

**Purpose**: Central registry of all campaigns

**Example**:
```typescript
export const EMAIL_CAMPAIGNS: EmailCampaign[] = [
  {
    id: 'practice-reminders',
    name: 'Practice Reminders',
    description: 'Weekly reminder to practice',
    schedule: '0 9 * * 5', // Fridays at 9 AM UTC
    status: 'active',
    templatePath: 'campaigns/reminders/reminder.template.ts',
    servicePath: 'campaigns/reminders/reminder.service.ts',
    endpoint: '/api/cron/send-reminders'
  }
];
```

**Rules**:
- ✅ Single source of truth
- ✅ Dashboard reads this
- ✅ GitHub Actions reads this
- ✅ Easy to add new campaigns

---

### Layer 4: Dashboard (Developer Interface)

**Location**: `src/routes/dev/email/+page.svelte`

**Purpose**: Visual interface for all email operations

**Features**:
- 📊 See all campaigns at a glance
- 👁️ Preview any email instantly
- 🧪 Test send to yourself
- ⏰ See next send times
- ✏️ Edit campaigns

**Architecture**:
```
Dashboard (UI)
    ↓
API Endpoints (Logic)
    ↓
Email Campaigns Config (Data)
    ↓
Services & Templates (Execution)
```

---

## 📂 File Organization

### Campaign Structure

```
src/lib/emails/campaigns/[campaign-name]/
├── [campaign].template.ts    # HTML template
├── [campaign].service.ts     # Business logic
└── [campaign].config.ts      # Campaign-specific config (optional)
```

**Example: Reminders Campaign**
```
src/lib/emails/campaigns/reminders/
├── reminder.template.ts      # HTML for reminder email
├── reminder.service.ts       # Logic: who gets reminders
└── reminder.config.ts        # Reminder-specific settings
```

**Example: Founder Sequence**
```
src/lib/emails/campaigns/founder-sequence/
├── day-1.template.ts         # Day 1 email HTML
├── day-2.template.ts         # Day 2 email HTML
├── day-3.template.ts         # Day 3 email HTML
├── founder.service.ts        # Logic: who gets what when
└── founder.config.ts         # Sequence settings
```

### Shared Utilities

```
src/lib/emails/shared/
├── email-sender.ts           # Resend wrapper
├── email-guard.ts            # Permission checks
├── email-permission.ts       # User preferences
└── email-scheduler.ts        # Cron utilities
```

---

## 🔄 Email Sending Flow

### Automated Send (via Cron)

```
1. GitHub Actions (scheduler)
   ↓ triggers at scheduled time

2. HTTP Endpoint (/api/cron/send-reminders)
   ↓ authenticates request

3. Service (reminder.service.ts)
   ↓ queries database for eligible users
   ↓ generates personalized data

4. Template (reminder.template.ts)
   ↓ renders HTML for each user

5. Email Sender (email-sender.ts)
   ↓ sends via Resend

6. User receives email ✅
```

### Manual Send (via Dashboard)

```
1. Developer clicks "Send Test" in dashboard
   ↓

2. API Endpoint (/api/dev/email/test)
   ↓ validates request

3. Template (reminder.template.ts)
   ↓ renders preview HTML

4. Email Sender (email-sender.ts)
   ↓ sends to test email

5. Developer receives email ✅
```

---

## 🎨 Dashboard Architecture

### Components

```svelte
<!-- Main Dashboard -->
<EmailDashboard>
  <CampaignList />         <!-- Table of all campaigns -->
  <PreviewPanel />         <!-- Live email preview -->
  <TestControls />         <!-- Send test email -->
  <QuickActions />         <!-- Create product update, etc -->
</EmailDashboard>
```

### Data Flow

```
1. Dashboard loads
   ↓
2. Fetch /api/dev/email/campaigns
   ↓
3. Get all campaigns from email-campaigns.config.ts
   ↓
4. Calculate next send times
   ↓
5. Display in table
   ↓
6. User clicks "Preview"
   ↓
7. Fetch /api/dev/email/preview/[campaign]
   ↓
8. Import template dynamically
   ↓
9. Render with sample data
   ↓
10. Display HTML in iframe
```

---

## 🔐 Security

### Cron Endpoint Protection

```typescript
// All cron endpoints check secret
export const GET: RequestHandler = async ({ url }) => {
  const secret = url.searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Execute cron job...
};
```

### Dev Dashboard Protection

```typescript
// Only accessible in development or to admins
export const load: PageServerLoad = async ({ locals }) => {
  if (process.env.NODE_ENV === 'production' && !locals.user?.isAdmin) {
    throw redirect(302, '/');
  }

  // Load dashboard data...
};
```

---

## 📊 Monitoring & Analytics

### Email Metrics Tracked

**Per Campaign**:
- Total sent
- Last sent timestamp
- Next scheduled send
- Estimated recipients

**Per Email** (future):
- Opens
- Clicks
- Bounces
- Unsubscribes

### Health Checks

```typescript
// Check if email system is healthy
export async function checkEmailHealth() {
  return {
    resendApiKey: !!process.env.RESEND_API_KEY,
    cronSecret: !!process.env.CRON_SECRET,
    campaigns: EMAIL_CAMPAIGNS.length,
    nextScheduledSend: getNextSendTime(),
    lastSuccessfulSend: await getLastSuccessfulSend()
  };
}
```

---

## 🚀 Scaling Considerations

### Current (12 users)

```
Sequential sending: Fine
100ms per email
12 users = 1.2 seconds total
```

### Medium Scale (1,000 users)

```
Sequential: 100 seconds (~2 min)
Still acceptable for GitHub Actions
```

### Large Scale (10,000+ users)

```
Option 1: Batch processing
- Split into chunks of 100
- Process in parallel
- 10,000 emails in ~10 minutes

Option 2: Background queue
- Use Upstash QStash or similar
- Offload from GitHub Actions
```

---

## 🔧 Extension Points

### Adding a New Campaign

**1. Create campaign directory**:
```bash
mkdir -p src/lib/emails/campaigns/new-campaign
touch src/lib/emails/campaigns/new-campaign/new.template.ts
touch src/lib/emails/campaigns/new-campaign/new.service.ts
```

**2. Add to config**:
```typescript
// src/lib/emails/email-campaigns.config.ts
{
  id: 'new-campaign',
  name: 'New Campaign',
  description: 'Description here',
  schedule: '0 10 * * 1', // Monday 10 AM
  status: 'active',
  templatePath: 'campaigns/new-campaign/new.template.ts',
  servicePath: 'campaigns/new-campaign/new.service.ts',
  endpoint: '/api/cron/new-campaign'
}
```

**3. Create endpoint**:
```bash
touch src/routes/api/cron/new-campaign/+server.ts
```

**4. Update GitHub Actions** (optional if manual only):
```yaml
# .github/workflows/cron-jobs.yml
- name: New Campaign
  run: curl "${{ secrets.FLY_APP_URL }}/api/cron/new-campaign?secret=${{ secrets.CRON_SECRET }}"
```

**That's it!** Dashboard automatically shows new campaign.

---

## 🧪 Testing Strategy

### Unit Tests (Templates)

```typescript
import { reminderTemplate } from './reminder.template';

test('renders reminder email with user name', () => {
  const html = reminderTemplate({
    userName: 'Test User',
    lastPracticed: new Date('2025-01-01'),
    nextScenario: 'Meeting Parents'
  });

  expect(html).toContain('Test User');
  expect(html).toContain('Meeting Parents');
});
```

### Integration Tests (Services)

```typescript
import { sendPracticeReminders } from './reminder.service';

test('sends reminders to inactive users', async () => {
  // Setup: Create test users
  await createTestUser({ lastPracticed: sevenDaysAgo() });

  // Execute
  const result = await sendPracticeReminders();

  // Assert
  expect(result.sent).toBe(1);
});
```

### E2E Tests (Dashboard)

```typescript
test('dashboard shows all campaigns', async ({ page }) => {
  await page.goto('/dev/email');

  // Should see all campaigns from config
  await expect(page.getByText('Practice Reminders')).toBeVisible();
  await expect(page.getByText('Founder Sequence')).toBeVisible();
});

test('preview email works', async ({ page }) => {
  await page.goto('/dev/email');
  await page.click('text=Preview'); // Click preview button

  // Should show email preview
  await expect(page.frameLocator('iframe')).toContainText('Hi Test User!');
});
```

---

## 📚 Related Documentation

- [Email System Migration](./email-system-migration.md) - How to migrate to this architecture
- [Email Dashboard Guide](./email-dashboard-guide.md) - How to use the dashboard
- [Email Testing Guide](./email-testing-guide.md) - Testing best practices
- [Kit Migration Guide](./email-kit-migration.md) - When/how to adopt Kit

---

## 🎯 Success Criteria

**Developer Productivity**:
- ✅ Any email can be previewed in <10 seconds
- ✅ Any email can be tested in <30 seconds
- ✅ New campaign can be added in <15 minutes
- ✅ All email code is easy to find

**System Reliability**:
- ✅ All emails send on schedule (99%+ reliability)
- ✅ Clear monitoring and alerting
- ✅ Easy to debug when issues occur

**Maintainability**:
- ✅ New developer can understand system in <1 hour
- ✅ Clear separation of concerns
- ✅ Well-documented and tested

---

**Last Updated**: 2025-11-21
**Status**: New architecture (being migrated to)
**Migration Guide**: See email-system-migration.md
