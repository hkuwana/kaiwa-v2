ALTER TABLE "user_settings" RENAME COLUMN "receive_daily_reminder_emails" TO "receive_practice_reminders";--> statement-breakpoint
ALTER TABLE "user_settings" RENAME COLUMN "receive_marketing_emails" TO "receive_founder_emails";--> statement-breakpoint
ALTER TABLE "user_settings" RENAME COLUMN "receive_weekly_digest" TO "receive_progress_reports";