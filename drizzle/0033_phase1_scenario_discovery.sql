-- Migration: Phase 1 Scenario Discovery & Sharing
-- Adds fields for browsing, categorization, sharing, and UGC attribution
-- Date: 2025-01-17

-- Add scenario category enum
DO $$ BEGIN
 CREATE TYPE "scenario_category" AS ENUM(
   'relationships',
   'professional',
   'travel',
   'education',
   'health',
   'daily_life',
   'entertainment',
   'food_drink',
   'services',
   'emergency'
 );
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add new columns to scenarios table
ALTER TABLE "scenarios"
  ADD COLUMN IF NOT EXISTS "categories" jsonb,
  ADD COLUMN IF NOT EXISTS "tags" jsonb,
  ADD COLUMN IF NOT EXISTS "primary_skill" text,
  ADD COLUMN IF NOT EXISTS "search_keywords" jsonb,
  ADD COLUMN IF NOT EXISTS "thumbnail_url" text,
  ADD COLUMN IF NOT EXISTS "estimated_duration_seconds" integer DEFAULT 600,
  ADD COLUMN IF NOT EXISTS "author_display_name" text DEFAULT 'Kaiwa Team',
  ADD COLUMN IF NOT EXISTS "share_slug" text,
  ADD COLUMN IF NOT EXISTS "share_url" text;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS "scenarios_primary_skill_idx" ON "scenarios" ("primary_skill");
CREATE INDEX IF NOT EXISTS "scenarios_duration_idx" ON "scenarios" ("estimated_duration_seconds");
CREATE INDEX IF NOT EXISTS "scenarios_share_slug_idx" ON "scenarios" ("share_slug");

-- Backfill existing scenarios with default values
UPDATE "scenarios"
SET
  "categories" = '["daily_life"]'::jsonb,
  "tags" = '[]'::jsonb,
  "estimated_duration_seconds" = 600,
  "author_display_name" = 'Kaiwa Team'
WHERE "categories" IS NULL;

-- Generate share slugs for existing scenarios
UPDATE "scenarios"
SET "share_slug" = CONCAT(id, '-', SUBSTRING(MD5(RANDOM()::text), 1, 8))
WHERE "share_slug" IS NULL;

-- Update specific scenarios with better categorization
UPDATE "scenarios"
SET
  "categories" = '["relationships"]'::jsonb,
  "tags" = '["family", "parents", "dinner", "first impression"]'::jsonb,
  "primary_skill" = 'conversation',
  "search_keywords" = '["meet parents", "family dinner", "earn trust", "cultural etiquette"]'::jsonb,
  "estimated_duration_seconds" = 1080
WHERE id = 'family-dinner-introduction';

UPDATE "scenarios"
SET
  "categories" = '["relationships"]'::jsonb,
  "tags" = '["family", "friends", "introductions"]'::jsonb,
  "primary_skill" = 'conversation',
  "search_keywords" = '["family friends", "social navigation", "relationships"]'::jsonb,
  "estimated_duration_seconds" = 900
WHERE id = 'inlaws-family-friends-intro';

UPDATE "scenarios"
SET
  "categories" = '["health", "emergency"]'::jsonb,
  "tags" = '["medical", "hospital", "urgent", "symptoms"]'::jsonb,
  "primary_skill" = 'conversation',
  "search_keywords" = '["emergency room", "triage", "medical emergency", "describe symptoms"]'::jsonb,
  "estimated_duration_seconds" = 600
WHERE id = 'clinic-night-triage';

UPDATE "scenarios"
SET
  "categories" = '["relationships"]'::jsonb,
  "tags" = '["dating", "first date", "romance"]'::jsonb,
  "primary_skill" = 'conversation',
  "search_keywords" = '["first date", "romance", "get to know", "dating"]'::jsonb,
  "estimated_duration_seconds" = 840
WHERE id = 'first-date-drinks';

UPDATE "scenarios"
SET
  "categories" = '["relationships"]'::jsonb,
  "tags" = '["apology", "conflict", "trust", "repair"]'::jsonb,
  "primary_skill" = 'conversation',
  "search_keywords" = '["apology", "relationship repair", "conflict resolution", "rebuild trust"]'::jsonb,
  "estimated_duration_seconds" = 720
WHERE id = 'relationship-apology';

UPDATE "scenarios"
SET
  "categories" = '["relationships"]'::jsonb,
  "tags" = '["vulnerability", "emotions", "intimacy"]'::jsonb,
  "primary_skill" = 'conversation',
  "search_keywords" = '["heart to heart", "vulnerability", "emotional intimacy", "share feelings"]'::jsonb,
  "estimated_duration_seconds" = 600
WHERE id = 'vulnerable-heart-to-heart';

UPDATE "scenarios"
SET
  "categories" = '["education"]'::jsonb,
  "tags" = '["beginner", "first conversation", "confidence"]'::jsonb,
  "primary_skill" = 'vocabulary',
  "search_keywords" = '["first conversation", "beginner", "confidence building"]'::jsonb,
  "estimated_duration_seconds" = 300
WHERE id = 'beginner-confidence-bridge';

UPDATE "scenarios"
SET
  "categories" = '["education"]'::jsonb,
  "tags" = '["practice", "free form", "learning"]'::jsonb,
  "primary_skill" = 'conversation',
  "search_keywords" = '["free practice", "open practice", "sandbox"]'::jsonb,
  "estimated_duration_seconds" = 600
WHERE id = 'onboarding-welcome';

-- Add comment explaining the migration
COMMENT ON COLUMN "scenarios"."categories" IS 'Categories for browsing (e.g., relationships, professional, travel)';
COMMENT ON COLUMN "scenarios"."tags" IS 'User-defined tags for discovery';
COMMENT ON COLUMN "scenarios"."primary_skill" IS 'Primary skill focus: conversation, listening, vocabulary, grammar';
COMMENT ON COLUMN "scenarios"."search_keywords" IS 'Keywords for full-text search';
COMMENT ON COLUMN "scenarios"."thumbnail_url" IS 'Visual thumbnail URL (watercolor/artistic style preferred)';
COMMENT ON COLUMN "scenarios"."estimated_duration_seconds" IS 'Estimated duration in seconds for session planning and tier limits';
COMMENT ON COLUMN "scenarios"."author_display_name" IS 'Author name for user-generated content attribution';
COMMENT ON COLUMN "scenarios"."share_slug" IS 'URL-friendly slug for shareable links (e.g., meeting-parents-jb2k)';
COMMENT ON COLUMN "scenarios"."share_url" IS 'Full shareable URL (e.g., https://kaiwa.app/s/meeting-parents-jb2k)';
