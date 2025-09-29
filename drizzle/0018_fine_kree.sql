CREATE TYPE "public"."audio_mode" AS ENUM('toggle', 'push_to_talk');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('desktop', 'mobile', 'tablet');--> statement-breakpoint
CREATE TYPE "public"."greeting_mode" AS ENUM('scenario', 'generic');--> statement-breakpoint
CREATE TYPE "public"."memory_level" AS ENUM('basic', 'human-like', 'elephant-like');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('succeeded', 'failed', 'pending', 'canceled', 'requires_payment_method', 'requires_confirmation');--> statement-breakpoint
CREATE TYPE "public"."phrase_frequency" AS ENUM('weekly', 'daily');--> statement-breakpoint
CREATE TYPE "public"."press_behavior" AS ENUM('tap_toggle', 'press_hold');--> statement-breakpoint
CREATE TYPE "public"."scenario_category" AS ENUM('onboarding', 'comfort', 'basic', 'intermediate', 'relationships', 'roleplay');--> statement-breakpoint
CREATE TYPE "public"."scenario_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."speaker_gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'plus', 'premium');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
ALTER TABLE "analytics_events" DROP CONSTRAINT "analytics_events_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_subscription_id_subscriptions_id_fk";
--> statement-breakpoint
ALTER TABLE "scenario_attempts" DROP CONSTRAINT "scenario_attempts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "scenario_attempts" DROP CONSTRAINT "scenario_attempts_scenario_id_scenarios_id_fk";
--> statement-breakpoint
ALTER TABLE "scenario_outcomes" DROP CONSTRAINT "scenario_outcomes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "scenario_outcomes" DROP CONSTRAINT "scenario_outcomes_conversation_id_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "scenario_outcomes" DROP CONSTRAINT "scenario_outcomes_scenario_id_scenarios_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "speakers" DROP CONSTRAINT "speakers_language_id_languages_id_fk";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_feature_profiles" DROP CONSTRAINT "user_feature_profiles_language_id_languages_id_fk";
--> statement-breakpoint
ALTER TABLE "user_preferences" DROP CONSTRAINT "user_preferences_target_language_id_languages_id_fk";
--> statement-breakpoint
-- Handle device_type conversion safely
-- First, update any invalid values to a valid enum value
UPDATE "conversation_sessions" SET "device_type" = 'desktop' WHERE "device_type" NOT IN ('desktop', 'mobile', 'tablet') OR "device_type" IS NULL;
-- Then convert to enum type
ALTER TABLE "conversation_sessions" ALTER COLUMN "device_type" SET DATA TYPE device_type USING device_type::device_type;--> statement-breakpoint
-- Handle payment_status conversion safely
UPDATE "payments" SET "status" = 'pending' WHERE "status" NOT IN ('succeeded', 'failed', 'pending', 'canceled', 'requires_payment_method', 'requires_confirmation') OR "status" IS NULL;
ALTER TABLE "payments" ALTER COLUMN "status" SET DATA TYPE payment_status USING status::payment_status;--> statement-breakpoint
-- Handle scenario_category conversion safely
UPDATE "scenarios" SET "category" = 'comfort' WHERE "category" NOT IN ('onboarding', 'comfort', 'basic', 'intermediate', 'relationships', 'roleplay') OR "category" IS NULL;
-- Drop the default first, then convert, then add the default back
ALTER TABLE "scenarios" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "scenarios" ALTER COLUMN "category" SET DATA TYPE scenario_category USING category::scenario_category;
ALTER TABLE "scenarios" ALTER COLUMN "category" SET DEFAULT 'comfort';--> statement-breakpoint
-- Handle scenario_difficulty conversion safely
UPDATE "scenarios" SET "difficulty" = 'beginner' WHERE "difficulty" NOT IN ('beginner', 'intermediate', 'advanced') OR "difficulty" IS NULL;
-- Drop the default first, then convert, then add the default back
ALTER TABLE "scenarios" ALTER COLUMN "difficulty" DROP DEFAULT;
ALTER TABLE "scenarios" ALTER COLUMN "difficulty" SET DATA TYPE scenario_difficulty USING difficulty::scenario_difficulty;
ALTER TABLE "scenarios" ALTER COLUMN "difficulty" SET DEFAULT 'beginner';--> statement-breakpoint
-- Handle speaker_gender conversion safely
UPDATE "speakers" SET "gender" = 'male' WHERE "gender" NOT IN ('male', 'female') OR "gender" IS NULL;
ALTER TABLE "speakers" ALTER COLUMN "gender" SET DATA TYPE speaker_gender USING gender::speaker_gender;--> statement-breakpoint
-- Handle subscription_tier conversion safely
UPDATE "subscriptions" SET "current_tier" = 'free' WHERE "current_tier" NOT IN ('free', 'plus', 'premium') OR "current_tier" IS NULL;
-- Drop the default first, then convert, then add the default back
ALTER TABLE "subscriptions" ALTER COLUMN "current_tier" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "current_tier" SET DATA TYPE subscription_tier USING current_tier::subscription_tier;
ALTER TABLE "subscriptions" ALTER COLUMN "current_tier" SET DEFAULT 'free';--> statement-breakpoint
-- Handle phrase_frequency conversion safely
UPDATE "tiers" SET "customized_phrases_frequency" = 'weekly' WHERE "customized_phrases_frequency" NOT IN ('weekly', 'daily') OR "customized_phrases_frequency" IS NULL;
-- Drop the default first, then convert, then add the default back
ALTER TABLE "tiers" ALTER COLUMN "customized_phrases_frequency" DROP DEFAULT;
ALTER TABLE "tiers" ALTER COLUMN "customized_phrases_frequency" SET DATA TYPE phrase_frequency USING customized_phrases_frequency::phrase_frequency;
ALTER TABLE "tiers" ALTER COLUMN "customized_phrases_frequency" SET DEFAULT 'weekly';--> statement-breakpoint
-- Handle memory_level conversion safely
UPDATE "tiers" SET "conversation_memory_level" = 'basic' WHERE "conversation_memory_level" NOT IN ('basic', 'human-like', 'elephant-like') OR "conversation_memory_level" IS NULL;
-- Drop the default first, then convert, then add the default back
ALTER TABLE "tiers" ALTER COLUMN "conversation_memory_level" DROP DEFAULT;
ALTER TABLE "tiers" ALTER COLUMN "conversation_memory_level" SET DATA TYPE memory_level USING conversation_memory_level::memory_level;
ALTER TABLE "tiers" ALTER COLUMN "conversation_memory_level" SET DEFAULT 'basic';--> statement-breakpoint
-- Handle theme conversion safely
UPDATE "user_settings" SET "theme" = 'system' WHERE "theme" NOT IN ('light', 'dark', 'system') OR "theme" IS NULL;
-- Drop the default first, then convert, then add the default back
ALTER TABLE "user_settings" ALTER COLUMN "theme" DROP DEFAULT;
ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DATA TYPE theme USING theme::theme;
ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DEFAULT 'system';--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_attempts" ADD CONSTRAINT "scenario_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_attempts" ADD CONSTRAINT "scenario_attempts_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_outcomes" ADD CONSTRAINT "scenario_outcomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_outcomes" ADD CONSTRAINT "scenario_outcomes_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_outcomes" ADD CONSTRAINT "scenario_outcomes_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_profiles" ADD CONSTRAINT "user_feature_profiles_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_target_language_id_languages_id_fk" FOREIGN KEY ("target_language_id") REFERENCES "public"."languages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_user_id_idx" ON "analytics_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analytics_events_event_name_idx" ON "analytics_events" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_session_id_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "analytics_events_user_event_idx" ON "analytics_events" USING btree ("user_id","event_name");--> statement-breakpoint
CREATE INDEX "analytics_events_event_time_idx" ON "analytics_events" USING btree ("event_name","created_at");--> statement-breakpoint
CREATE INDEX "conversation_sessions_device_type_idx" ON "conversation_sessions" USING btree ("device_type");--> statement-breakpoint
CREATE INDEX "conversation_sessions_user_language_idx" ON "conversation_sessions" USING btree ("user_id","language");--> statement-breakpoint
CREATE INDEX "conversation_sessions_duration_idx" ON "conversation_sessions" USING btree ("duration_minutes");--> statement-breakpoint
CREATE INDEX "conversation_sessions_extensions_idx" ON "conversation_sessions" USING btree ("was_extended","extensions_used");--> statement-breakpoint
CREATE INDEX "email_verification_active_idx" ON "email_verification" USING btree ("email","expires_at");--> statement-breakpoint
CREATE INDEX "payments_stripe_payment_intent_idx" ON "payments" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "payments_amount_currency_idx" ON "payments" USING btree ("amount","currency");--> statement-breakpoint
CREATE INDEX "scenario_attempts_user_id_idx" ON "scenario_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scenario_attempts_scenario_id_idx" ON "scenario_attempts" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "scenario_attempts_started_at_idx" ON "scenario_attempts" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "scenario_attempts_completed_at_idx" ON "scenario_attempts" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "scenario_attempts_user_scenario_idx" ON "scenario_attempts" USING btree ("user_id","scenario_id");--> statement-breakpoint
CREATE INDEX "scenario_attempts_attempt_number_idx" ON "scenario_attempts" USING btree ("attempt_number");--> statement-breakpoint
CREATE INDEX "scenario_outcomes_user_id_idx" ON "scenario_outcomes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scenario_outcomes_conversation_id_idx" ON "scenario_outcomes" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "scenario_outcomes_scenario_id_idx" ON "scenario_outcomes" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "scenario_outcomes_goal_achieved_idx" ON "scenario_outcomes" USING btree ("was_goal_achieved");--> statement-breakpoint
CREATE INDEX "scenario_outcomes_created_at_idx" ON "scenario_outcomes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "scenario_outcomes_user_scenario_idx" ON "scenario_outcomes" USING btree ("user_id","scenario_id");--> statement-breakpoint
CREATE INDEX "scenario_outcomes_grammar_score_idx" ON "scenario_outcomes" USING btree ("grammar_usage_score");--> statement-breakpoint
CREATE INDEX "scenario_outcomes_vocabulary_score_idx" ON "scenario_outcomes" USING btree ("vocabulary_usage_score");--> statement-breakpoint
CREATE INDEX "scenario_outcomes_pronunciation_score_idx" ON "scenario_outcomes" USING btree ("pronunciation_score");--> statement-breakpoint
CREATE INDEX "scenarios_active_category_idx" ON "scenarios" USING btree ("is_active","category");--> statement-breakpoint
CREATE INDEX "scenarios_active_difficulty_idx" ON "scenarios" USING btree ("is_active","difficulty");--> statement-breakpoint
CREATE INDEX "scenarios_title_idx" ON "scenarios" USING btree ("title");--> statement-breakpoint
CREATE INDEX "session_user_active_idx" ON "session" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "speakers_bcp47_code_idx" ON "speakers" USING btree ("bcp47_code");--> statement-breakpoint
CREATE INDEX "speakers_language_gender_idx" ON "speakers" USING btree ("language_id","gender");--> statement-breakpoint
CREATE INDEX "speakers_voice_provider_idx" ON "speakers" USING btree ("voice_provider_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_subscription_idx" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_price_idx" ON "subscriptions" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_tier_idx" ON "subscriptions" USING btree ("user_id","current_tier");--> statement-breakpoint
CREATE INDEX "tiers_monthly_price_idx" ON "tiers" USING btree ("monthly_price_usd");--> statement-breakpoint
CREATE INDEX "tiers_active_pricing_idx" ON "tiers" USING btree ("is_active","monthly_price_usd");--> statement-breakpoint
CREATE INDEX "user_feature_profiles_mastery_idx" ON "user_feature_profiles" USING btree ("mastery_score");--> statement-breakpoint
CREATE INDEX "user_feature_profiles_streak_idx" ON "user_feature_profiles" USING btree ("streak_length");--> statement-breakpoint
CREATE INDEX "user_feature_profiles_user_language_idx" ON "user_feature_profiles" USING btree ("user_id","language_id");--> statement-breakpoint
CREATE INDEX "user_feature_profiles_review_queue_idx" ON "user_feature_profiles" USING btree ("review_priority","last_seen_at");--> statement-breakpoint
CREATE INDEX "user_preferences_learning_goal_idx" ON "user_preferences" USING btree ("learning_goal");--> statement-breakpoint
CREATE INDEX "user_preferences_confidence_idx" ON "user_preferences" USING btree ("confidence_score");--> statement-breakpoint
CREATE INDEX "user_preferences_user_confidence_idx" ON "user_preferences" USING btree ("user_id","confidence_score");--> statement-breakpoint
CREATE INDEX "user_usage_tier_idx" ON "user_usage" USING btree ("tier_when_used");--> statement-breakpoint
CREATE INDEX "user_usage_overage_idx" ON "user_usage" USING btree ("overage_seconds");--> statement-breakpoint
CREATE INDEX "user_usage_last_activity_idx" ON "user_usage" USING btree ("last_conversation_at","last_realtime_at");