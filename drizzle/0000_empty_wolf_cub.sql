CREATE TABLE "conversation_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tier_id" text NOT NULL,
	"language" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration_minutes" integer,
	"minutes_consumed" integer NOT NULL,
	"was_extended" boolean DEFAULT false,
	"extensions_used" integer DEFAULT 0,
	"transcription_mode" boolean DEFAULT false,
	"device_type" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"target_language_id" text,
	"title" text,
	"mode" text DEFAULT 'traditional',
	"voice" text,
	"scenario_id" text,
	"is_onboarding" text DEFAULT 'false',
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp,
	"duration_seconds" integer,
	"message_count" integer DEFAULT 0,
	"audio_seconds" numeric(8, 2) DEFAULT '0',
	"comfort_rating" integer,
	"engagement_level" text
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"native_name" text NOT NULL,
	"is_rtl" boolean DEFAULT false NOT NULL,
	"has_romanization" boolean DEFAULT true NOT NULL,
	"writing_system" text NOT NULL,
	"supported_scripts" json,
	"is_supported" boolean DEFAULT true NOT NULL,
	CONSTRAINT "languages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"audio_url" text
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"stripe_payment_intent_id" text,
	"stripe_invoice_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "payments_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'comfort',
	"difficulty" text DEFAULT 'beginner',
	"instructions" text,
	"context" text,
	"expected_outcome" text,
	"learning_objectives" json,
	"comfort_indicators" json,
	"is_active" text DEFAULT 'true',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speakers" (
	"id" text PRIMARY KEY NOT NULL,
	"language_id" text NOT NULL,
	"region" text NOT NULL,
	"dialect_name" text NOT NULL,
	"bcp47_code" text NOT NULL,
	"speaker_emoji" text NOT NULL,
	"gender" text NOT NULL,
	"voice_name" text NOT NULL,
	"voice_provider_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"openai_voice_id" text DEFAULT 'alloy'
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"status" text NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false,
	"tier_id" text NOT NULL,
	"is_active" boolean DEFAULT false,
	"effective_tier" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"monthly_conversations" integer,
	"monthly_seconds" integer,
	"monthly_realtime_sessions" integer,
	"max_session_length_seconds" integer,
	"session_banking_enabled" boolean DEFAULT false,
	"max_banked_seconds" integer,
	"has_realtime_access" boolean DEFAULT false,
	"has_advanced_voices" boolean DEFAULT false,
	"has_analytics" boolean DEFAULT false,
	"has_custom_phrases" boolean DEFAULT false,
	"has_conversation_memory" boolean DEFAULT false,
	"has_anki_export" boolean DEFAULT false,
	"monthly_price_usd" numeric(10, 2),
	"annual_price_usd" numeric(10, 2),
	"stripe_product_id" text,
	"stripe_price_id_monthly" text,
	"stripe_price_id_annual" text,
	"conversation_timeout_ms" integer,
	"warning_threshold_ms" integer,
	"can_extend" boolean DEFAULT false,
	"max_extensions" integer DEFAULT 0,
	"extension_duration_ms" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_language_id" text,
	"learning_goal" text DEFAULT 'conversational',
	"preferred_voice" text DEFAULT 'alloy',
	"daily_goal_minutes" integer DEFAULT 30,
	"skill_level" integer DEFAULT 5,
	"speaking_level" integer DEFAULT 5,
	"listening_level" integer DEFAULT 5,
	"reading_level" integer DEFAULT 5,
	"writing_level" integer DEFAULT 5,
	"confidence_level" integer DEFAULT 50,
	"total_study_time_minutes" integer DEFAULT 0,
	"total_conversations" integer DEFAULT 0,
	"current_streak_days" integer DEFAULT 0,
	"last_studied" timestamp DEFAULT now(),
	"specific_goals" text,
	"recent_session_scores" text,
	"last_assessment_date" timestamp,
	"skill_level_history" text,
	"challenge_preference" text DEFAULT 'moderate',
	"correction_style" text DEFAULT 'gentle',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_usage" (
	"user_id" text NOT NULL,
	"tier_id" text NOT NULL,
	"period" text NOT NULL,
	"conversations_used" integer DEFAULT 0,
	"seconds_used" integer DEFAULT 0,
	"realtime_sessions_used" integer DEFAULT 0,
	"banked_seconds" integer DEFAULT 0,
	"banked_seconds_used" integer DEFAULT 0,
	"monthly_conversations" integer,
	"monthly_seconds" integer,
	"monthly_realtime_sessions" integer,
	"max_banked_seconds" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_usage_user_id_period_pk" PRIMARY KEY("user_id","period")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" text,
	"username" text,
	"display_name" text,
	"email" text NOT NULL,
	"avatar_url" text,
	"stripe_customer_id" text,
	"native_language_id" text DEFAULT 'en' NOT NULL,
	"preferred_ui_language_id" text DEFAULT 'ja' NOT NULL,
	"default_tier" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_usage" timestamp,
	"hashed_password" text,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_tier_id_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_target_language_id_languages_id_fk" FOREIGN KEY ("target_language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tier_id_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_target_language_id_languages_id_fk" FOREIGN KEY ("target_language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_tier_id_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversation_sessions_user_idx" ON "conversation_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversation_sessions_start_time_idx" ON "conversation_sessions" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "conversation_sessions_language_idx" ON "conversation_sessions" USING btree ("language");--> statement-breakpoint
CREATE INDEX "conversations_user_id_idx" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversations_target_language_id_idx" ON "conversations" USING btree ("target_language_id");--> statement-breakpoint
CREATE INDEX "conversations_mode_idx" ON "conversations" USING btree ("mode");--> statement-breakpoint
CREATE INDEX "conversations_scenario_id_idx" ON "conversations" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "conversations_is_onboarding_idx" ON "conversations" USING btree ("is_onboarding");--> statement-breakpoint
CREATE INDEX "conversations_started_at_idx" ON "conversations" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "conversations_ended_at_idx" ON "conversations" USING btree ("ended_at");--> statement-breakpoint
CREATE INDEX "conversations_user_language_idx" ON "conversations" USING btree ("user_id","target_language_id");--> statement-breakpoint
CREATE INDEX "conversations_started_ended_idx" ON "conversations" USING btree ("started_at","ended_at");--> statement-breakpoint
CREATE INDEX "languages_code_idx" ON "languages" USING btree ("code");--> statement-breakpoint
CREATE INDEX "languages_writing_system_idx" ON "languages" USING btree ("writing_system");--> statement-breakpoint
CREATE INDEX "languages_is_supported_idx" ON "languages" USING btree ("is_supported");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_role_idx" ON "messages" USING btree ("role");--> statement-breakpoint
CREATE INDEX "messages_timestamp_idx" ON "messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "messages_conversation_timestamp_idx" ON "messages" USING btree ("conversation_id","timestamp");--> statement-breakpoint
CREATE INDEX "messages_conversation_role_idx" ON "messages" USING btree ("conversation_id","role");--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_subscription_id_idx" ON "payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_currency_idx" ON "payments" USING btree ("currency");--> statement-breakpoint
CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payments_user_status_idx" ON "payments" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "scenarios_category_idx" ON "scenarios" USING btree ("category");--> statement-breakpoint
CREATE INDEX "scenarios_difficulty_idx" ON "scenarios" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "scenarios_is_active_idx" ON "scenarios" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "speakers_language_id_idx" ON "speakers" USING btree ("language_id");--> statement-breakpoint
CREATE INDEX "speakers_is_active_idx" ON "speakers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "speakers_gender_idx" ON "speakers" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "speakers_region_idx" ON "speakers" USING btree ("region");--> statement-breakpoint
CREATE INDEX "speakers_language_active_idx" ON "speakers" USING btree ("language_id","is_active");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_tier_id_idx" ON "subscriptions" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "subscriptions_is_active_idx" ON "subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "subscriptions_user_status_idx" ON "subscriptions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "subscriptions_updated_at_idx" ON "subscriptions" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "tiers_is_active_idx" ON "tiers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "tiers_stripe_product_idx" ON "tiers" USING btree ("stripe_product_id");--> statement-breakpoint
CREATE INDEX "user_preferences_user_id_idx" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_preferences_target_language_idx" ON "user_preferences" USING btree ("target_language_id");--> statement-breakpoint
CREATE INDEX "user_preferences_updated_at_idx" ON "user_preferences" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "user_usage_user_idx" ON "user_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_usage_period_idx" ON "user_usage" USING btree ("period");--> statement-breakpoint
CREATE INDEX "user_usage_user_period_idx" ON "user_usage" USING btree ("user_id","period");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_default_tier_idx" ON "users" USING btree ("default_tier");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_last_usage_idx" ON "users" USING btree ("last_usage");