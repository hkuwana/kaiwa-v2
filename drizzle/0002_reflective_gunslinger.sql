ALTER TABLE "conversation_sessions" DROP CONSTRAINT "conversation_sessions_tier_id_tiers_id_fk";
--> statement-breakpoint
ALTER TABLE "user_usage" DROP CONSTRAINT "user_usage_tier_id_tiers_id_fk";
--> statement-breakpoint
DROP INDEX "users_default_tier_idx";--> statement-breakpoint
ALTER TABLE "conversation_sessions" ALTER COLUMN "duration_minutes" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "target_language_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "mode" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "is_onboarding" SET DEFAULT 'true';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "is_onboarding" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "started_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "audio_seconds" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ALTER COLUMN "category" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ALTER COLUMN "difficulty" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ALTER COLUMN "instructions" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ALTER COLUMN "context" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ALTER COLUMN "is_active" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "scenarios" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "scenarios" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "monthly_conversations" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "monthly_seconds" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "monthly_realtime_sessions" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "target_language_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "learning_goal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "preferred_voice" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "daily_goal_minutes" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "speaking_level" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "listening_level" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "reading_level" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "writing_level" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "confidence_level" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "total_study_time_minutes" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "total_conversations" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "current_streak_days" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "last_studied" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "challenge_preference" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "correction_style" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "guest_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "translated_content" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "source_language" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "target_language" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "grammar_analysis" jsonb;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "vocabulary_analysis" jsonb;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "pronunciation_score" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "audio_duration" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "difficulty_level" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "learning_tags" jsonb;--> statement-breakpoint
CREATE INDEX "conversations_guest_id_idx" ON "conversations" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "messages_language_idx" ON "messages" USING btree ("source_language","target_language");--> statement-breakpoint
CREATE INDEX "messages_difficulty_idx" ON "messages" USING btree ("difficulty_level");--> statement-breakpoint
ALTER TABLE "conversation_sessions" DROP COLUMN "tier_id";--> statement-breakpoint
ALTER TABLE "user_usage" DROP COLUMN "tier_id";--> statement-breakpoint
ALTER TABLE "user_usage" DROP COLUMN "monthly_conversations";--> statement-breakpoint
ALTER TABLE "user_usage" DROP COLUMN "monthly_seconds";--> statement-breakpoint
ALTER TABLE "user_usage" DROP COLUMN "monthly_realtime_sessions";--> statement-breakpoint
ALTER TABLE "user_usage" DROP COLUMN "max_banked_seconds";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "default_tier";