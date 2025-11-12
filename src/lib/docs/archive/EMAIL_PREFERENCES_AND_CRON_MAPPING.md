# Email Preferences & Cron Jobs Mapping

## Current Email Preference Columns in `user_settings` Table

| Column Name | DB Column | Default | Purpose |
|---|---|---|---|
| `receivePracticeReminders` | `receive_practice_reminders` | `true` | Daily reminders to inactive users |
| `receiveFounderEmails` | `receive_founder_emails` | `true` | 3-day founder welcome sequence |
| `receiveProductUpdates` | `receive_product_updates` | `true` | Product announcements & features |
| `receiveProgressReports` | `receive_progress_reports` | `true` | Weekly practice statistics |
| `receiveSecurityAlerts` | `receive_security_alerts` | `true` | Security & account notifications |
| `receivedFounderEmail` | `received_founder_email` | `false` | Flag: founder email was already sent |
| `dailyReminderSentCount` | `daily_reminder_sent_count` | `0` | Counter for rate-limiting reminders |
| `lastReminderSentAt` | `last_reminder_sent_at` | `null` | Timestamp of last reminder sent |

---

## Cron Jobs & Their Email Preference Dependencies

### 1. Practice Reminders Cron
- **File**: `src/routes/api/cron/send-reminders/+server.ts`
- **Schedule**: Mondays & Thursdays at 9:00 AM UTC
- **Preference Used**: `receivePracticeReminders`
- **Service**: `EmailReminderService.sendBulkReminders()`
- **Checks**:
  - User opted in via `receivePracticeReminders = true`
  - User has practiced in last 7 days
  - Rate-limiting via `lastReminderSentAt`
- **Segments**: Groups users by activity level (new, slightly inactive, moderately inactive, highly inactive, dormant)
- **Current Status**: ✅ Working with correct preference field

---

### 2. Founder Emails Cron
- **File**: `src/routes/api/cron/founder-emails/+server.ts`
- **Schedule**: Every afternoon (2-4 PM local time) - Daily
- **Preference Used**: `receiveFounderEmails`
- **Tracking**: `receivedFounderEmail` flag prevents resending
- **Sequence**:
  - **Day 1**: Warm welcome email (only for non-practicing users)
  - **Day 2**: Check-in with offer of help
  - **Day 3**: Personal offer to schedule a call
- **Service**: `FounderEmailService.sendDay1Welcome()`, `.sendDay2CheckIn()`, `.sendDay3PersonalOffer()`
- **Checks**:
  - User opted in via `receiveFounderEmails = true`
  - User hasn't received Day 1 email yet (`receivedFounderEmail = false`)
- **Current Status**: ✅ Working with correct preference field

---

### 3. Weekly Stats/Progress Reports Cron
- **File**: `src/routes/api/cron/weekly-stats/+server.ts`
- **Schedule**: Every Saturday at 11:00 AM UTC
- **Preference Used**: `receiveProgressReports`
- **Service**: `WeeklyStatsEmailService.sendWeeklyStats()`
- **Checks**:
  - User opted in via `receiveProgressReports = true`
  - User has active sessions in the past week
- **Current Status**: ✅ Working with correct preference field

---

### 4. Weekly Digest/Product Updates Cron
- **File**: `src/routes/api/cron/weekly-digest/+server.ts`
- **Schedule**: Every Sunday at 10:00 AM UTC
- **Preference Used**: `receiveProductUpdates`
- **Service**: `WeeklyUpdatesEmailService.sendWeeklyDigest()`
- **Checks**:
  - User opted in via `receiveProductUpdates = true`
- **Current Status**: ✅ Working with correct preference field

---

### 5. Community Stories Cron
- **File**: `src/routes/api/cron/community-stories/+server.ts`
- **Schedule**: Every Friday at 10:00 AM UTC
- **Preference Used**: `receiveProductUpdates`
- **Service**: `CommunityStoryEmailService.sendCommunityStories()`
- **Checks**:
  - User opted in via `receiveProductUpdates = true`
- **Note**: Shares preference with Weekly Digest
- **Current Status**: ✅ Working with correct preference field

---

### 6. Scenario Inspiration Cron
- **File**: `src/routes/api/cron/scenario-inspiration/+server.ts`
- **Schedule**: Every Tuesday at 10:00 AM UTC
- **Preference Used**: `receiveProductUpdates`
- **Service**: `ScenarioInspirationEmailService.sendScenarioInspiration()`
- **Checks**:
  - User opted in via `receiveProductUpdates = true`
- **Note**: Shares preference with Weekly Digest
- **Current Status**: ✅ Working with correct preference field

---

### 7. Progress Reports Cron (Alternative)
- **File**: `src/routes/api/cron/progress-reports/+server.ts`
- **Schedule**: Saturdays at 9:00 AM UTC
- **Preference Used**: `receiveProgressReports`
- **Service**: `ProgressReportsEmailService.sendProgressReports()`
- **Note**: May be duplicate of Weekly Stats (verify if both are needed)
- **Current Status**: ✅ Working with correct preference field

---

### 8. Product Updates Cron (Manual)
- **File**: `src/routes/api/cron/product-updates/+server.ts`
- **Schedule**: Manual (POST request to trigger)
- **Preference Used**: `receiveProductUpdates`
- **Service**: `ProductUpdatesEmailService.sendProductUpdate()`
- **Checks**:
  - User opted in via `receiveProductUpdates = true`
- **Current Status**: ✅ Working with correct preference field

---

## Preference-to-Cron Cross-Reference

### `receivePracticeReminders`
- ✅ Send Reminders Cron (Mon & Thu)

### `receiveFounderEmails`
- ✅ Founder Emails Cron (Daily)

### `receiveProductUpdates`
- ✅ Weekly Digest (Sunday)
- ✅ Community Stories (Friday)
- ✅ Scenario Inspiration (Tuesday)
- ✅ Product Updates Manual (On-demand)

### `receiveProgressReports`
- ✅ Weekly Stats (Saturday 11 AM)
- ✅ Progress Reports (Saturday 9 AM) - **Possible duplicate?**

### `receiveSecurityAlerts`
- ❌ **NOT USED BY ANY CRON JOB YET**
- Reserved for future security notifications

---

## Recommended Changes for Future Consideration

### 1. **Consolidate Progress Report Crons**
If both `weekly-stats` and `progress-reports` do similar things, consolidate into one job.
- Current: Two jobs run on Saturday (9 AM and 11 AM)
- Suggested: Merge into single cron job

### 2. **Add Separate Preference for Community/Inspiration Content**
Currently uses `receiveProductUpdates`, which means users get:
- Weekly Digest (Sundays)
- Community Stories (Fridays)
- Scenario Inspiration (Tuesdays)

Consider splitting into separate preferences if users should be able to opt out of community content while keeping product updates.

### 3. **Implement Security Alerts**
The `receiveSecurityAlerts` preference exists but isn't used.
- Create cron job for security notifications
- Examples: suspicious login attempts, password changes, new device access

### 4. **Reduce Email Fatigue**
Current weekly schedule sends emails 3 days per week (Fri, Sat, Sun). Consider:
- Consolidating community stories + product updates into one weekly email
- Moving to bi-weekly digest model
- Implementing frequency preferences (weekly, bi-weekly, monthly)

### 5. **Track Security Alerts Separately**
Consider adding to user_settings:
```sql
-- New optional columns
receiveCommunityStories: boolean (default: true) -- separate from product updates
receiveScenarioInspiration: boolean (default: true) -- separate from product updates
emailFrequency: 'weekly' | 'bi-weekly' | 'monthly' (default: 'weekly')
```

---

## Current Issues Fixed

✅ **Fixed on 2025-11-06**:
- Repository method `updateEmailPreferences()` - Corrected field names and switched to `upsertSettings()`
- Frontend component `EmailPreferences.svelte` - Updated to use correct field names
- Frontend labels - Now show "Founder Emails" instead of "Marketing Emails", "Practice Reminders" instead of "Daily Reminders"

---

## Testing Email Preferences

### Manual Testing
1. Go to `/profile?tab=email`
2. Toggle each preference
3. Check browser console (F12) for logs:
   - `Saving preferences: {...}`
   - `Save successful, server returned: {...}`
4. Verify debug box shows updated state

### Database Verification
```sql
-- Check user's email preferences
SELECT userId, receivePracticeReminders, receiveFounderEmails,
       receiveProductUpdates, receiveProgressReports, receiveSecurityAlerts
FROM user_settings
WHERE userId = 'YOUR_USER_ID';
```

---

## Implementation Checklist for Cron Job Changes

- [ ] Identify which crons to consolidate/change
- [ ] Create migration if adding new preference columns
- [ ] Update `user-settings.ts` schema
- [ ] Update `user-settings.repository.ts` to include new preferences
- [ ] Update `EmailPermissionService` with new methods
- [ ] Update `EmailPreferences.svelte` component UI
- [ ] Update cron endpoints to use new preferences
- [ ] Create email templates for any new email types
- [ ] Test cron jobs locally with dry-run mode
- [ ] Deploy and monitor first execution
