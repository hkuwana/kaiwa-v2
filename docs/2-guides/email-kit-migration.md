# Kit (ConvertKit) Migration Guide

> **When to migrate from Resend to Kit**: This guide helps you decide if/when to adopt Kit for marketing emails while keeping Resend for transactional emails.

## 🤔 Should You Migrate to Kit?

### Decision Framework

**Stay with Resend ONLY if**:
- ✅ You have < 100 users (cost = $0/month)
- ✅ You're technical and comfortable with code
- ✅ You want maximum control over personalization
- ✅ Your emails are data-driven (stats, suggestions)

**Add Kit when**:
- ✅ You have 100+ users (Kit starts being worth it)
- ✅ You want visual email builder (non-technical editing)
- ✅ You need complex drip campaigns (30-day sequences)
- ✅ You want landing pages + email in one tool
- ✅ You hire a marketer (non-technical team member)

**Hybrid Approach (Recommended at 100+ users)**:
- Resend: Transactional emails (signup, password reset, notifications)
- Kit: Marketing emails (weekly digest, campaigns, broadcasts)

---

## 📊 Cost Comparison

### Current (Resend Only)

| Users | Emails/Month | Resend Cost | Total    |
|-------|--------------|-------------|----------|
| 12    | ~100         | $0          | **$0**   |
| 50    | ~400         | $0          | **$0**   |
| 100   | ~800         | $0          | **$0**   |
| 500   | ~4,000       | $20/mo      | **$20**  |
| 1,000 | ~8,000       | $40/mo      | **$40**  |

### With Kit (Hybrid)

| Users | Kit Cost | Resend Cost | Total    | ROI                        |
|-------|----------|-------------|----------|----------------------------|
| 12    | $0       | $0          | **$0**   | No benefit                 |
| 50    | $0       | $0          | **$0**   | No benefit                 |
| 100   | $25/mo   | $0          | **$25**  | Visual builder, automation |
| 500   | $33/mo   | $0          | **$33**  | Drip campaigns, analytics  |
| 1,000 | $41/mo   | $0          | **$41**  | Landing pages, segments    |

### ROI Break-Even Analysis

**Kit becomes worth it when**:
- You save 2+ hours/month on email operations
- You run 3+ drip campaigns simultaneously
- You hire a marketer (non-technical)
- You need landing pages (saves $30-50/mo on other tools)

**At 12 users**: ❌ Not worth $25/month
**At 100 users**: ⚠️ Maybe (if you value visual builder)
**At 500 users**: ✅ Yes (saves time, adds features)

---

## 🗓️ Migration Timeline

### Recommended Path

```
0-50 users
├─ Resend only
├─ Build dashboard (this migration)
└─ Perfect your templates

50-100 users
├─ Still Resend only
├─ Consider Kit if hiring marketer
└─ Start planning Kit integration

100-300 users
├─ Add Kit for marketing emails
├─ Keep Resend for transactional
└─ Sync users to Kit via webhook

300+ users
├─ Full hybrid system
├─ Complex drip campaigns in Kit
└─ Advanced segmentation
```

### When NOT to Migrate

**Don't migrate to Kit if**:
- ❌ You're under 100 users (waste of money)
- ❌ Your emails are heavily data-driven (Kit is worse for this)
- ❌ You like coding templates (Resend is better)
- ❌ You don't need drip campaigns yet

---

## 🔄 Migration Phases (When Ready)

### Phase 1: Setup Kit (Week 1)

**Steps**:

1. **Sign up for Kit**:
   - Go to kit.com
   - Start with free tier (up to 1,000 subscribers)

2. **Verify domain**:
   - Add DNS records for trykaiwa.com
   - Verify sending domain

3. **Get API credentials**:
   ```bash
   # Add to .env
   KIT_API_SECRET=your_api_secret_here
   KIT_API_KEY=your_api_key_here
   ```

4. **Install SDK**:
   ```bash
   npm install @convertkit/convertkit-node
   ```

5. **Create custom fields** (in Kit dashboard):
   - `user_id` (text)
   - `language_learning` (text)
   - `persona` (text) - sofia, david, jamie, rosa
   - `scenarios_completed` (number)
   - `is_paying` (boolean)
   - `signup_date` (date)

6. **Create tags** (in Kit dashboard):
   - `paying-customer`
   - `pab-member`
   - `persona-sofia`
   - `persona-david`
   - `persona-jamie`
   - `persona-rosa`
   - `highly-engaged`
   - `dormant`

---

### Phase 2: Sync Users (Week 2)

**Goal**: Get all existing users into Kit

**Create sync service**:

```typescript
// src/lib/integrations/kit-sync.service.ts
import ConvertKit from '@convertkit/convertkit-node';
import { db } from '$lib/server/db';

const kit = new ConvertKit(process.env.KIT_API_SECRET);

export async function syncUserToKit(userId: string) {
  // Get user from database
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) return;

  // Add to Kit
  const subscriber = await kit.subscribers.create({
    email: user.email,
    first_name: user.firstName,
    fields: {
      user_id: user.id,
      language_learning: user.languageLearning,
      persona: user.persona,
      scenarios_completed: user.scenariosCompleted || 0,
      is_paying: user.isPaying || false,
      signup_date: user.createdAt
    }
  });

  // Add tags
  if (user.isPaying) {
    await kit.tags.tagSubscriber({
      tagId: await getTagId('paying-customer'),
      email: user.email
    });
  }

  if (user.persona) {
    await kit.tags.tagSubscriber({
      tagId: await getTagId(`persona-${user.persona.toLowerCase()}`),
      email: user.email
    });
  }

  return subscriber;
}

// Bulk sync all users
export async function bulkSyncToKit() {
  const users = await db.query.users.findMany();

  for (const user of users) {
    await syncUserToKit(user.id);
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`Synced ${users.length} users to Kit`);
}
```

**Run initial sync**:
```bash
npx tsx scripts/sync-all-users-to-kit.ts
```

**Set up auto-sync** (webhook on user signup):
```typescript
// src/hooks.server.ts
import { syncUserToKit } from '$lib/integrations/kit-sync.service';

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    // Sync to Kit in background
    syncUserToKit(session.user.id).catch(console.error);
  }
});
```

---

### Phase 3: Migrate Weekly Digest (Week 3)

**Goal**: Move weekly digest from Resend → Kit

**Option A: Use Kit's Visual Builder** (Recommended)

1. **Create sequence in Kit dashboard**:
   - Name: "Weekly Digest"
   - Type: Broadcast (manual send)

2. **Design email in Kit**:
   - Use drag-and-drop builder
   - Add your branding
   - Use Liquid variables: `{{ subscriber.first_name }}`

3. **Send via Kit API**:
   ```typescript
   // src/lib/emails/campaigns/weekly-digest/digest-kit.service.ts
   import ConvertKit from '@convertkit/convertkit-node';

   const kit = new ConvertKit(process.env.KIT_API_SECRET);

   export async function sendWeeklyDigestViaKit(content: {
     subject: string;
     preview: string;
   }) {
     await kit.broadcasts.create({
       subject: content.subject,
       content: `
         <h1>Week {{ week_number }}</h1>
         <p>Hi {{ subscriber.first_name }},</p>
         ${content.preview}
       `,
       published_at: new Date().toISOString()
     });
   }
   ```

**Option B: Use Kit API with Your Templates**

```typescript
// Still use your Resend templates, but send via Kit
export async function sendWeeklyDigestViaKitAPI(digest: WeeklyDigest) {
  const html = weeklyDigestTemplate(digest); // Your existing template

  await kit.broadcasts.create({
    subject: digest.subject,
    content: html,
    published_at: new Date().toISOString()
  });
}
```

---

### Phase 4: Migrate Other Campaigns (Week 4)

**Priority order** (migrate in this order):

1. **Weekly Digest** ✅ (Done in Phase 3)
2. **Founder Email Sequence** (best fit for Kit's drip campaigns)
3. **Scenario Suggestions** (benefits from segmentation)
4. **Community Stories** (occasional broadcasts)

**Keep in Resend**:
- ❌ Practice Reminders (data-driven, personalized stats)
- ❌ Weekly Stats (heavily personalized with user data)
- ❌ Transactional emails (signup, password reset)

---

### Phase 5: Advanced Kit Features (Ongoing)

**Once migrated, use**:

**1. Drip Campaigns**:
```
Day 0: Welcome email
Day 1: First scenario suggestion
Day 3: Practice encouragement
Day 7: Progress check-in
Day 14: Upgrade prompt
```

**2. Segmentation**:
```
Segment: "Engaged Sofia Users"
- Tag: persona-sofia
- Tag: highly-engaged
- Field: scenarios_completed > 5

Send targeted content about meeting partner's family
```

**3. A/B Testing**:
```
Test subject lines:
A: "Your week in Kaiwa - 7 scenarios practiced"
B: "You're making progress! Here's your week"

Kit automatically splits traffic 50/50
```

**4. Landing Pages**:
```
Create landing pages for:
- Lead magnets ("5 Phrases for Meeting Parents")
- Webinar signups (Practice Lab events)
- Referral program
```

---

## 🔀 Hybrid Architecture (Final State)

```
┌─────────────────────────────────────────────────────┐
│ USER SIGNUP                                         │
└────────────────┬────────────────────────────────────┘
                 │
                 ├─→ Supabase (user record created)
                 │
                 ├─→ Resend (welcome email)
                 │   - Transactional
                 │   - Instant
                 │
                 └─→ Kit (add to subscriber list)
                     - Webhook sync
                     - Add tags
                     - Start drip campaign

┌─────────────────────────────────────────────────────┐
│ ONGOING EMAILS                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ RESEND (Transactional + Data-Driven)               │
│ ├─ Password reset                                  │
│ ├─ Email verification                              │
│ ├─ Security alerts                                 │
│ ├─ Practice reminders (personalized stats)         │
│ └─ Weekly stats (complex personalization)          │
│                                                     │
│ KIT (Marketing + Campaigns)                        │
│ ├─ Weekly digest (visual builder)                  │
│ ├─ Founder email sequence (drip campaign)          │
│ ├─ Scenario suggestions (segments)                 │
│ ├─ Community stories (broadcasts)                  │
│ └─ Product updates (broadcasts)                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Migration Checklist

### Pre-Migration Decision
- [ ] You have 100+ users
- [ ] You're spending 2+ hours/week on email
- [ ] You need drip campaigns
- [ ] You have budget for $25-40/month

### Setup (Week 1)
- [ ] Kit account created
- [ ] Domain verified
- [ ] API keys added to .env
- [ ] Custom fields created
- [ ] Tags created

### Sync (Week 2)
- [ ] Sync service built
- [ ] All users synced to Kit
- [ ] Webhook auto-sync enabled
- [ ] Verified data in Kit dashboard

### Migration (Week 3-4)
- [ ] Weekly digest migrated
- [ ] Founder sequence migrated
- [ ] Other campaigns as needed
- [ ] Transactional emails stay in Resend

### Post-Migration
- [ ] Monitor open rates (Kit vs Resend)
- [ ] A/B test subject lines
- [ ] Create drip campaigns
- [ ] Build landing pages

---

## 💰 Cost Tracking

### Monthly Costs (Example at 500 users)

**Before Kit**:
```
Resend: $20/month (4,000 emails)
Total: $20/month
```

**After Kit (Hybrid)**:
```
Kit: $33/month (500 subscribers, marketing emails)
Resend: $0/month (transactional only, <3K emails)
Total: $33/month

Extra value:
+ Visual email builder
+ Drip campaigns
+ Landing pages
+ A/B testing
+ Advanced analytics
```

**ROI**: Extra $13/month for significantly better marketing capabilities

---

## 🚦 Go/No-Go Decision

### ✅ Go to Kit When:

```
if (users >= 100 &&
    (timeSpentOnEmail >= 2hours/week ||
     needDripCampaigns ||
     hiringMarketer)) {
  return "Migrate to Kit";
}
```

### ❌ Stay with Resend When:

```
if (users < 100 ||
    allEmailsAreTransactional ||
    loveCodeMoreThanGUI) {
  return "Stick with Resend";
}
```

---

## 🔗 Related Documentation

- [Email System Migration](./email-system-migration.md) - Reorganize current system first
- [Email Dashboard Guide](./email-dashboard-guide.md) - Use dashboard before Kit
- [Email Testing Guide](./email-testing-guide.md) - Test both Resend and Kit

---

**Recommendation for Kaiwa**:
- **Now (12 users)**: ❌ Don't use Kit
- **At 50 users**: ⚠️ Probably not yet
- **At 100 users**: ✅ Consider it
- **At 300+ users**: ✅✅ Definitely use Kit

**Next Milestone**: Revisit this decision when you hit **100 users** (likely in 2-3 months at current growth rate).

---

**Last Updated**: 2025-11-21
**Current Status**: Resend only (recommended)
**Next Review**: At 100 users
