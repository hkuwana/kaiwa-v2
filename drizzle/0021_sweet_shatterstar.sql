-- Rename column from category to role
ALTER TABLE "scenarios" RENAME COLUMN "category" TO "role";--> statement-breakpoint

-- Drop old indexes
DROP INDEX "scenarios_category_idx";--> statement-breakpoint
DROP INDEX "scenarios_active_category_idx";--> statement-breakpoint

-- Remove the existing default before changing types so we can drop the old enum
ALTER TABLE "scenarios" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint

-- Temporarily set column to text to avoid enum constraint
ALTER TABLE "scenarios" ALTER COLUMN "role" TYPE text;--> statement-breakpoint

-- Map legacy categories to the new role taxonomy
UPDATE "scenarios"
SET "role" = CASE
	WHEN "role" IN ('onboarding', 'basic', 'intermediate') THEN 'tutor'
	WHEN "role" IN ('comfort', 'relationships') THEN 'friendly_chat'
	WHEN "role" = 'roleplay' THEN 'roleplay'
	ELSE 'tutor'
END;--> statement-breakpoint

-- Drop old enum
DROP TYPE "public"."scenario_category";--> statement-breakpoint

-- Create new enum with MECE roles
CREATE TYPE "public"."scenario_role" AS ENUM('tutor', 'roleplay', 'friendly_chat', 'expert');--> statement-breakpoint

-- Update the column to use new enum
ALTER TABLE "scenarios" ALTER COLUMN "role" TYPE "public"."scenario_role" USING "role"::"public"."scenario_role";--> statement-breakpoint

-- Restore default aligned with the new enum
ALTER TABLE "scenarios" ALTER COLUMN "role" SET DEFAULT 'tutor';--> statement-breakpoint

-- Create new indexes
CREATE INDEX "scenarios_role_idx" ON "scenarios" USING btree ("role");--> statement-breakpoint
CREATE INDEX "scenarios_active_role_idx" ON "scenarios" USING btree ("is_active","role");