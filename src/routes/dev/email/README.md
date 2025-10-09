# 📧 Email Testing Page

Development tool for testing all email templates.

## Access

Visit: `http://localhost:5173/dev/email` (when running dev server)

## Features

- Test all email types without actually sending to real users
- All test emails sent to: **weijo34@gmail.com**
- Emails are clearly marked as [TEST] in subject line
- Test banner added to email body

## Available Email Types

### 📧 Practice Reminders

- **Standard Practice Reminder**: Personalized reminder with scenarios and streak info

### 👋 Founder Email Sequence

- **Day 1 - Welcome**: Warm welcome from founder
- **Day 2 - Check-in**: Checking in with common concerns
- **Day 3 - Personal Offer**: Cal.com link to book a call

### 🎯 Segmented Reminders

- **New User**: Welcome message showing what's possible
- **Slightly Inactive (1-3 days)**: Gentle nudge to practice
- **Moderately Inactive (3-7 days)**: Motivation boost
- **Highly Inactive (7-30 days)**: Re-engagement with what's new
- **Dormant (30+ days)**: Win-back campaign

## Usage

1. Log in to the app
2. Navigate to `/dev/email`
3. Select an email type
4. Click "📨 Send Test Email"
5. Check **weijo34@gmail.com** inbox

## Technical Details

- **Endpoint**: `POST /dev/email`
- **Authentication**: Required (uses current logged-in user)
- **Test Email**: `weijo34@gmail.com` (hardcoded)
- **Services Used**:
  - `EmailReminderService`
  - `EmailReminderEnhancedService`
  - `FounderEmailService`

## Notes

- Uses your current user data for personalization
- Safe to test repeatedly - won't affect production data
- All emails go to test address only
