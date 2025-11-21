# Next Steps: Email Cost Control Strategy

## ✅ What We Just Completed

### Email System Migration (DONE)

- ✅ Reorganized 11 email files into campaign-based structure
- ✅ Created central config at `src/lib/emails/email-campaigns.config.ts`
- ✅ Updated 36 files with new import paths
- ✅ Enhanced `/dev/email` dashboard with campaigns overview table
- ✅ All 8 campaigns now visible at a glance

### File Organization (DONE)

```
src/lib/emails/
├── campaigns/
│   ├── reminders/          - Practice reminders (Mon/Thu)
│   ├── founder-sequence/   - Day 1-3 onboarding
│   ├── weekly-stats/       - Weekly progress reports
│   ├── weekly-digest/      - Product updates digest
│   ├── scenario-inspiration/ - Scenario suggestions
│   ├── community-stories/  - User success stories
│   ├── progress-reports/   - Monthly reports
│   └── product-updates/    - Launch announcements
├── shared/                 - Reusable utilities
└── email-campaigns.config.ts - Single source of truth
```

---

## 🎯 Immediate Priority: Email Cost Control

**Problem**: You're hitting Resend's daily email limits, which means you're sending $20/month for 50k emails.

### Current Email Volume Breakdown

Based on your 8 active campaigns:

| Campaign             | Frequency       | Est. Recipients          | Monthly Emails  |
| -------------------- | --------------- | ------------------------ | --------------- |
| Practice Reminders   | 2x/week         | All opted-in users       | ~8x per user    |
| Founder Sequence     | Daily (Day 1-3) | New non-practicing users | 3x per new user |
| Weekly Stats         | Weekly          | Active users             | 4x per user     |
| Weekly Digest        | Weekly          | All opted-in             | 4x per user     |
| Scenario Inspiration | Weekly          | Active users             | 4x per user     |
| Community Stories    | Weekly          | Opted-in users           | 4x per user     |
| Progress Reports     | Monthly         | Active users             | 1x per user     |
| Product Updates      | Manual          | All users                | ~1-2x per month |

**Estimated total**: 24-30 emails per user per month

**At current scale**:

- If you're hitting daily limits, you're likely sending 100-200 emails/day
- That's ~3,000-6,000 emails/month
- Suggests you have ~100-250 active users

---

## 📋 Action Plan for Cost Control

### Phase 1: Immediate Actions (This Week)

#### 1. Add Email Preferences Table

**Goal**: Let users opt out of non-critical emails

**Implementation**:

```typescript
// Already exists in user_settings table:
- practiceReminderFrequency: 'daily' | 'weekly' | 'never'
- receiveFounderEmails: boolean
- receiveProductUpdates: boolean
- receiveProgressReports: boolean

// ADD THESE new fields:
- receiveScenarioInspiration: boolean
- receiveCommunityStories: boolean
- receiveWeeklyDigest: boolean
```

**Impact**:

- If 30% opt out of weekly content emails → Save 30% on volume
- Could drop from $20/month to $14/month immediately

#### 2. Implement Smart Frequency Caps

**Goal**: Don't email anyone more than 3x per week

**Add to each campaign service**:

```typescript
async function shouldSendEmail(userId: string): Promise<boolean> {
	// Check: Has user received 3+ emails this week?
	const thisWeekEmails = await getEmailsSentThisWeek(userId);
	if (thisWeekEmails >= 3) {
		return false; // Skip this email
	}
	return true;
}
```

**Impact**:

- Reduces email fatigue
- Caps max emails at 12/month per user (down from 24-30)
- Could save 40-50% on volume

#### 3. Add User Segmentation

**Goal**: Only email users who actually engage

**Segments**:

```typescript
type UserSegment =
	| 'active' // Practiced in last 7 days → Email normally
	| 'engaged' // Practiced in last 30 days → Email 50% less
	| 'dormant' // 30+ days inactive → Only 1 re-engagement email/month
	| 'churned'; // 90+ days inactive → No emails
```

**Impact**:

- If 40% of users are dormant/churned → Save 40% on those users
- Improves deliverability (better open rates)
- Stay under free tier longer

---

### Phase 2: Medium-term (Next 2 Weeks)

#### 4. Email Analytics Dashboard

**Goal**: See which emails are actually valuable

**Metrics to track**:

- Open rates per campaign
- Click rates per campaign
- Unsubscribe rates per campaign
- Cost per engaged user

**Tools**:

- Resend has built-in analytics
- Add tracking pixels for open rates
- Track link clicks via UTM parameters

**Action**:

- If any campaign has <10% open rate → Pause or redesign it
- If weekly digest has <5% clicks → Make it monthly instead

#### 5. A/B Test Email Frequency

**Goal**: Find optimal frequency that balances engagement & cost

**Test**:

- Group A: Current frequency (2x practice reminders/week)
- Group B: Reduced frequency (1x practice reminder/week)

**Measure**:

- Practice sessions per user
- User retention
- Email open rates
- Cost per retained user

**Expected result**: Weekly reminders might be just as effective as 2x/week, saving 50% on that campaign.

---

### Phase 3: Long-term (Month 2-3)

#### 6. Implement Email Digests

**Goal**: Combine multiple emails into one weekly digest

**Current problem**: Sending 4 separate emails per week:

- Practice reminder
- Scenario inspiration
- Community story
- Weekly digest

**Solution**: Combine into ONE weekly email with sections:

```
Subject: Your weekly Kaiwa update

1. 🎯 Practice Reminder (personalized)
2. 💡 Scenario Suggestion
3. 📰 This Week's Update
4. 🌟 Community Story
```

**Impact**:

- 4 emails → 1 email per week
- Save 75% on content emails
- Better user experience (less inbox clutter)

#### 7. Consider ConvertKit/Kit Migration

**Only when**: You hit 1,000+ users

**Why wait**:

- Kit costs $41/month for 1,000 subscribers
- Resend costs $20/month for 50k emails
- Only worth it if you need:
  - Visual email builder (for non-technical team)
  - Landing pages (save $30-50/month on other tools)
  - Advanced drip campaigns

**For now**: Stick with Resend, it's way cheaper.

---

## 📊 Projected Cost Savings

### Without Changes

- Current: $20/month (50k emails)
- At 1,000 users: $20-40/month
- At 5,000 users: $100-200/month
- At 10,000 users: $200-400/month

### With Email Preferences + Segmentation

- Current: $0-14/month (under 50k)
- At 1,000 users: $20/month
- At 5,000 users: $40-60/month
- At 10,000 users: $80-120/month

### With All Optimizations (Preferences + Segmentation + Digests)

- Current: $0/month (under free tier!)
- At 1,000 users: $0-20/month
- At 5,000 users: $20-40/month
- At 10,000 users: $40-60/month

**Total savings at 10k users**: $300-340/month

---

## 🚀 Quick Wins (Do These First)

### This Week:

1. **Add email preference toggles to `/profile` page**
   - Use existing fields in `user_settings` table
   - Add checkboxes for each campaign type
   - Impact: Immediate 20-30% reduction

2. **Implement frequency cap** (3 emails/week max)
   - Add helper function in `email-guard.ts`
   - Check before sending any email
   - Impact: 40% reduction

3. **Pause lowest-performing campaign**
   - Check Resend analytics
   - Pause campaign with <10% open rate
   - Impact: 12.5% reduction (1 of 8 campaigns)

**Combined impact**: Could drop from $20/month to $10/month this week.

---

## 💡 Pro Tips for Solo Developer

### 1. Don't Email Inactive Users

```typescript
// In each campaign service:
if (daysSinceLastPractice > 30) {
	return false; // Don't email
}
```

### 2. Make Unsubscribe Super Easy

```typescript
// In every email footer:
<a href="${APP_URL}/profile?unsubscribe=weekly-digest">
  Unsubscribe from weekly updates
</a>
```

### 3. Track Everything

```sql
-- Create email_log table
CREATE TABLE email_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  campaign_id TEXT,
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP
);
```

### 4. Send at Optimal Times

- Don't send all emails at once (spreads out Resend's daily limit)
- Stagger by timezone if possible
- Current schedule already does this well!

---

## 🎯 Success Metrics

Track these weekly:

1. **Email volume**: Total emails sent/week
2. **Cost per user**: Monthly email cost ÷ active users
3. **Engagement rate**: Opens ÷ sends
4. **Retention impact**: Do emails improve retention?

**Target**:

- Keep cost per user < $0.20/month
- Maintain >20% open rate on all campaigns
- Unsubscribe rate <2%

---

## 📁 Files to Modify

### For Email Preferences:

1. `src/routes/profile/+page.svelte` - Add preference toggles
2. `src/lib/emails/shared/email-permission.ts` - Check new preferences
3. Database migration - Add new boolean columns to user_settings

### For Frequency Caps:

1. `src/lib/emails/shared/email-guard.ts` - Add frequency check
2. Create `src/lib/emails/shared/email-tracker.ts` - Track sent emails

### For Segmentation:

1. `src/lib/emails/shared/user-segmentation.ts` - Segment logic
2. Each campaign service - Check segment before sending

---

## 🔗 Resources

- **Resend Pricing**: https://resend.com/pricing
- **Email Best Practices**: Wait until 100+ users before over-optimizing
- **ConvertKit Pricing**: https://convertkit.com/pricing (wait until 1k+ users)

---

## ✅ Checklist

### This Week

- [ ] Add email preference toggles to profile page
- [ ] Implement 3 emails/week frequency cap
- [ ] Check Resend analytics for low-performing campaigns
- [ ] Pause 1 low-performing campaign

### Next Week

- [ ] Add user segmentation (active/engaged/dormant/churned)
- [ ] Track email opens/clicks
- [ ] Create email analytics dashboard

### Month 2

- [ ] A/B test email frequency
- [ ] Consider combining emails into weekly digest
- [ ] Review costs and adjust strategy

---

**Last Updated**: 2025-11-21
**Status**: Migration complete, ready for cost optimization
**Next Review**: In 1 week after implementing preferences
