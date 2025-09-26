ALTER TABLE "user_usage" ADD COLUMN "basic_analyses_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "quick_stats_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "grammar_suggestions_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "advanced_grammar_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "fluency_analysis_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "phrase_suggestions_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "onboarding_profile_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "pronunciation_analysis_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "speech_rhythm_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "audio_suggestion_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "daily_usage" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "last_analysis_at" timestamp;--> statement-breakpoint
 