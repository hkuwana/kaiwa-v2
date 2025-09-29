ALTER TABLE "user_preferences" ADD COLUMN "current_language_level" text DEFAULT 'A1.1' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "practical_level" text DEFAULT 'basic-greetings' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "confidence_score" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "last_level_assessment" timestamp;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "level_progression" jsonb DEFAULT '[]'::jsonb;