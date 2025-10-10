-- Rename column from category to role
ALTER TABLE "scenarios" RENAME COLUMN "category" TO "role";--> statement-breakpoint

-- Drop old indexes
DROP INDEX "scenarios_category_idx";--> statement-breakpoint
DROP INDEX "scenarios_active_category_idx";--> statement-breakpoint

-- Temporarily set column to text to avoid enum constraint
ALTER TABLE "scenarios" ALTER COLUMN "role" TYPE text;--> statement-breakpoint

-- Drop old enum
DROP TYPE "public"."scenario_category";--> statement-breakpoint

-- Create new enum with MECE roles
CREATE TYPE "public"."scenario_role" AS ENUM('tutor', 'character', 'friend');--> statement-breakpoint

-- Update the column to use new enum
ALTER TABLE "scenarios" ALTER COLUMN "role" TYPE "public"."scenario_role" USING "role"::"public"."scenario_role";--> statement-breakpoint

-- Create new indexes
CREATE INDEX "scenarios_role_idx" ON "scenarios" USING btree ("role");--> statement-breakpoint
CREATE INDEX "scenarios_active_role_idx" ON "scenarios" USING btree ("is_active","role");