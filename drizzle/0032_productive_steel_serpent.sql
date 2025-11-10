ALTER TABLE "user_settings" DROP COLUMN "practice_reminder_frequency";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "preferred_reminder_day";--> statement-breakpoint
DROP TYPE "public"."day_of_week";--> statement-breakpoint
DROP TYPE "public"."practice_reminder_frequency";