DO $$
BEGIN
	CREATE TYPE "public"."practice_reminder_frequency" AS ENUM('never', 'daily', 'weekly');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$
BEGIN
	CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "practice_reminder_frequency" "practice_reminder_frequency" DEFAULT 'weekly' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "preferred_reminder_day" "day_of_week" DEFAULT 'friday' NOT NULL;
