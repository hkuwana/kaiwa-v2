DO $$ BEGIN
  CREATE TYPE "public"."scenario_category" AS ENUM('relationships', 'professional', 'travel', 'education', 'health', 'daily_life', 'entertainment', 'food_drink', 'services', 'emergency');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."scenario_role" AS ENUM('tutor', 'character', 'friendly_chat', 'expert');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "categories" json;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "tags" json;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "primary_skill" text;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "search_keywords" json;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "estimated_duration_seconds" integer DEFAULT 600;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "author_display_name" text DEFAULT 'Kaiwa Team';--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "share_slug" text;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "share_url" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scenarios_primary_skill_idx" ON "scenarios" USING btree ("primary_skill");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scenarios_duration_idx" ON "scenarios" USING btree ("estimated_duration_seconds");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scenarios_share_slug_idx" ON "scenarios" USING btree ("share_slug");