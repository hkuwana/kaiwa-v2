# PostHog KPI Tracking Guide

## Overview

This guide documents how to track and calculate the early-stage KPIs for Kaiwa using PostHog events and insights.

---

## Events Being Tracked

### 1. `conversation_completed` (Server-Side)

**When**: After conversation is saved to database with ≥2 user messages
**Location**: `/api/conversations/[id]/post-run` endpoint
**Properties**:

```json
{
	"conversation_id": "uuid",
	"language_id": "ja",
	"mode": "traditional|realtime",
	"duration_seconds": 180,
	"user_message_count": 5,
	"total_message_count": 12,
	"is_first_conversation": true,
	"scenario_id": "uuid or null",
	"engagement_level": "low|medium|high",
	"timestamp": "ISO-8601"
}
```

### 2. `conversation_session_started` (Client-Side)

**When**: User starts a conversation
**Location**: Conversation timer store
**Properties**: `{ tier: 'free|plus|premium' }`

### 3. `conversation_session_ended` (Client-Side)

**When**: User ends or session expires
**Properties**: `{ reason: 'stopped', duration_seconds: 180, tier: 'free|plus|premium' }`

### 4. `user_feedback_submitted` (Client-Side)

**When**: User submits feedback via FeedbackButton
**Properties**:

```json
{
	"feedback_type": "bug|suggestion|debug",
	"feedback_message": "User's message",
	"page_url": "https://...",
	"page_pathname": "/conversation"
}
```

---

## KPI Calculations in PostHog

### 1. WACU (Weekly Active Conversation Users)

**Definition**: Unique users who completed at least one full conversation (start → analysis) in the last 7 days.

**PostHog Insight Setup**:

1. Create **Trends** insight
2. Event: `conversation_completed`
3. Aggregation: **Unique users** (distinctId)
4. Time range: **Last 7 days**
5. Breakdown: (optional) By language, mode, engagement level

**Expected Result**: Single number showing active users

**Dashboard Card**: Big Number Widget - "Weekly Active Conversation Users (WACU)"

---

### 2. WCS (Weekly Conversation Sessions)

**Definition**: Total number of completed conversations (start → analysis) in the last 7 days.

**PostHog Insight Setup**:

1. Create **Trends** insight
2. Event: `conversation_completed`
3. Aggregation: **Total count**
4. Time range: **Last 7 days**
5. Breakdown: (optional) By language, mode

**Expected Result**: Single number showing total sessions

**Dashboard Card**: Big Number Widget - "Weekly Conversation Sessions (WCS)"

---

### 3. CpAU (Conversations Per Active User)

**Definition**: Average conversations per active user. Formula: `WCS ÷ WACU`

**PostHog Insight Setup**:

1. Create **Funnel** or **Custom SQL** insight (recommended: SQL for flexibility)
2. Use SQL to calculate:

```sql
WITH wacu AS (
  SELECT COUNT(DISTINCT distinct_id) as active_users
  FROM events
  WHERE event = 'conversation_completed'
  AND timestamp >= now() - interval 7 days
),
wcs AS (
  SELECT COUNT(*) as total_conversations
  FROM events
  WHERE event = 'conversation_completed'
  AND timestamp >= now() - interval 7 days
)
SELECT
  (SELECT total_conversations FROM wcs) /
  (SELECT active_users FROM wacu) as conversations_per_active_user
```

**Dashboard Card**: Gauge or Big Number Widget - "CpAU (Target: ≥2)"

---

### 4. FWR (First-Week Repeat Rate)

**Definition**: % of users who completed their first conversation this week AND returned for at least one more conversation within 7 days.

**PostHog Insight Setup**:

1. Create **Funnel** insight
2. Step 1: `conversation_completed` where `is_first_conversation = true` (past 7 days)
3. Step 2: `conversation_completed` where `is_first_conversation = false` (same user, within 7 days)
4. Shows: Drop-off rate = FWR %

**Alternative SQL Approach**:

```sql
WITH first_time_users AS (
  SELECT DISTINCT distinct_id
  FROM events
  WHERE event = 'conversation_completed'
  AND properties->>'is_first_conversation' = 'true'
  AND timestamp >= now() - interval 7 days
),
returning_users AS (
  SELECT DISTINCT distinct_id
  FROM events
  WHERE event = 'conversation_completed'
  AND timestamp >= now() - interval 7 days
  AND distinct_id IN (SELECT distinct_id FROM first_time_users)
)
SELECT
  (SELECT COUNT(*) FROM returning_users) * 100.0 /
  (SELECT COUNT(*) FROM first_time_users) as first_week_repeat_rate_percent
```

**Dashboard Card**: Percentage Widget - "First-Week Repeat Rate (FWR) %"

---

### 5. MTPW (Manual Touchpoints Per Week)

**Definition**: Number of high-touch interactions with users per week.

**PostHog Tracking**: Manual input via Notion/Airtable (not automated)

**Alternative**: Create custom events for manual touchpoints:

```typescript
track('manual_touchpoint', {
	touchpoint_type: 'pab_call|loom_review|zoom_1on1|async_feedback',
	user_id: 'uuid',
	duration_minutes: 30
});
```

**Dashboard Card**: Manually updated or use automated tracking if implemented

---

## Setting Up Your Weekly Dashboard

### Dashboard Steps:

1. **Go to PostHog** → Create new Dashboard
2. **Name**: "Early-Stage KPIs (Weekly)"
3. **Add Cards** in this order:

#### Card 1: WACU

- Trends insight
- Event: `conversation_completed`
- Aggregation: Unique users
- Period: Last 7 days
- Display: Big Number

#### Card 2: WCS

- Trends insight
- Event: `conversation_completed`
- Aggregation: Count
- Period: Last 7 days
- Display: Big Number

#### Card 3: CpAU

- SQL insight (use SQL from above)
- Display: Gauge (Target ≥2)

#### Card 4: FWR

- Funnel insight (see above)
- Display: Percentage / Gauge

#### Card 5: Conversation Completion Rate (Funnel)

- Step 1: `conversation_session_started`
- Step 2: `conversation_completed`
- Shows drop-off from start → completion
- Display: Funnel visualization

#### Card 6: Language Breakdown

- Trends insight
- Event: `conversation_completed`
- Breakdown: By `language_id`
- Period: Last 7 days
- Display: Bar chart

#### Card 7: Engagement Distribution

- Trends insight
- Event: `conversation_completed`
- Breakdown: By `engagement_level`
- Period: Last 7 days
- Display: Pie chart

#### Card 8: Mode Usage (Traditional vs Realtime)

- Trends insight
- Event: `conversation_completed`
- Breakdown: By `mode`
- Period: Last 7 days
- Display: Pie chart

---

## Verification Checklist

- [ ] `conversation_completed` events are appearing in PostHog (check Events tab)
- [ ] Server-side tracking is active (NODE_ENV = production)
- [ ] User identification is working (distinct_id matches your user IDs)
- [ ] First-conversation flag is being set correctly
- [ ] Dashboard displays data from past 7 days
- [ ] All KPI calculations are working

---

## Testing & Validation

### How to Test Server-Side Tracking:

1. **Complete a test conversation** in your app
2. **Check PostHog Events tab**:
   - Search for `conversation_completed`
   - Verify properties are populated correctly
   - Check timestamp is recent

3. **Use PostHog Inspector**:
   - Open browser DevTools
   - Go to PostHog settings → Session recording
   - Look for `conversation_completed` event in timeline

### Common Issues:

| Issue                      | Solution                                    |
| -------------------------- | ------------------------------------------- |
| No events appear           | Check NODE_ENV is 'production'              |
| Missing properties         | Verify trackServerEvent includes all fields |
| Distinct_id is 'anonymous' | User might not be authenticated             |
| Events delayed             | Check PostHog flush interval (set to 1)     |

---

## PostHog Survey Integration

### FeedbackButton Survey Setup:

The FeedbackButton now triggers a PostHog survey after feedback submission.

**Setup Steps**:

1. **Go to PostHog** → Create new Survey
2. **Survey Type**: "Open-ended question"
3. **Question**: "How satisfied are you with Kaiwa?" (or similar)
4. **Display**: After `user_feedback_submitted` event
5. **Copy Survey ID** (format: `survey_xxx`)
6. **Update FeedbackButton.svelte**:

```typescript
posthog.showSurvey('survey_YOUR_ID_HERE'); // Replace with your survey ID
```

---

## Weekly Review Process

**Every Friday**:

1. Open your Early-Stage KPIs dashboard
2. Document the numbers:
   - WACU: \_\_\_
   - WCS: \_\_\_
   - CpAU: \_\_\_
   - FWR: \_\_\_
   - MTPW: \_\_\_ (manual count)

3. Calculate growth rate: `(This week - Last week) / Last week * 100`

4. Identify what moved the needle:
   - Did MTPW correlate with FWR increase?
   - Did language changes affect engagement?
   - Which scenarios have highest engagement?

5. Plan next week's focus

---

## Advanced: Custom Cohorts

Create a PostHog Cohort for:

- **"First-time users"**: `is_first_conversation = true`
- **"Active users"**: Completed ≥2 conversations in 7 days
- **"Highly engaged"**: `engagement_level = 'high'`
- **"At-risk"**: Haven't completed conversation in 7 days

Use these in insights for deeper analysis.

---

## Troubleshooting

### Q: Events show up in dev but not production?

**A**: Check that `NODE_ENV !== 'production'` in `posthog.ts`. Make sure deployed version has env vars set correctly.

### Q: WACU and WCS are the same number?

**A**: Expected if each user completes only 1 conversation/week. Check individual users in PostHog Person tab.

### Q: FWR stuck at 0%?

**A**: Not enough users have returned yet. Funnel takes time to populate. Check back after more data.

### Q: Survey not showing?

**A**: Verify survey ID is correct. Check PostHog docs for survey trigger conditions.

---

## Resources

- [PostHog Trends Documentation](https://posthog.com/docs/product-analytics/trends)
- [PostHog SQL Insights](https://posthog.com/docs/product-analytics/sql)
- [PostHog Funnels](https://posthog.com/docs/product-analytics/funnels)
- [PostHog Surveys](https://posthog.com/docs/surveys/overview)
