CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" text,
	"event_name" text NOT NULL,
	"properties" json,
	"user_agent" text,
	"ip_address" text,
	"referrer" text,
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
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp,
	"duration_seconds" integer,
	"message_count" integer DEFAULT 0,
	"audio_minutes" numeric(8, 2) DEFAULT '0'
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
	"audio_id" text
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
CREATE TABLE "scenario_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"scenario_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"completed_steps" json,
	"abandoned_at" text,
	"time_spent_seconds" integer,
	"hints_used" integer DEFAULT 0,
	"translations_used" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scenario_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"conversation_id" text NOT NULL,
	"scenario_id" text NOT NULL,
	"was_goal_achieved" boolean NOT NULL,
	"goal_completion_score" numeric(3, 2),
	"grammar_usage_score" numeric(3, 2),
	"vocabulary_usage_score" numeric(3, 2),
	"pronunciation_score" numeric(3, 2),
	"used_target_vocabulary" json,
	"missed_target_vocabulary" json,
	"grammar_errors" json,
	"ai_feedback" text,
	"suggestions" json,
	"duration_seconds" integer NOT NULL,
	"exchange_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" text PRIMARY KEY NOT NULL,
	"language_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"context" text NOT NULL,
	"goal" text NOT NULL,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"category" text NOT NULL,
	"target_grammar" text,
	"target_vocabulary" json,
	"example_responses" json,
	"translation_hints" json,
	"vocabulary_preview" json,
	"ai_role" text NOT NULL,
	"ai_personality" text,
	"is_active" boolean DEFAULT true NOT NULL,
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
	"created_at" timestamp DEFAULT now()
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
	"monthly_minutes" integer,
	"monthly_realtime_sessions" integer,
	"has_realtime_access" boolean DEFAULT false,
	"has_advanced_voices" boolean DEFAULT false,
	"has_analytics" boolean DEFAULT false,
	"monthly_price_usd" numeric(10, 2),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "user_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"conversations_used" integer DEFAULT 0,
	"minutes_used" integer DEFAULT 0,
	"realtime_sessions_used" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" text,
	"username" text,
	"display_name" text,
	"email" text NOT NULL,
	"avatar_url" text,
	"native_language_id" text DEFAULT 'en' NOT NULL,
	"preferred_ui_language_id" text DEFAULT 'ja' NOT NULL,
	"tier" text DEFAULT 'free' NOT NULL,
	"subscription_status" text,
	"subscription_id" text,
	"subscription_expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"last_usage" timestamp,
	"hashed_password" text,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vocabulary_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"language_id" text NOT NULL,
	"word" text NOT NULL,
	"encounter_count" integer DEFAULT 0 NOT NULL,
	"successful_usage_count" integer DEFAULT 0 NOT NULL,
	"mastery_level" text DEFAULT 'new' NOT NULL,
	"last_reviewed" timestamp,
	"next_review" timestamp,
	"review_interval" integer,
	"first_encountered" timestamp DEFAULT now(),
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_target_language_id_languages_id_fk" FOREIGN KEY ("target_language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_attempts" ADD CONSTRAINT "scenario_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_attempts" ADD CONSTRAINT "scenario_attempts_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_outcomes" ADD CONSTRAINT "scenario_outcomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_outcomes" ADD CONSTRAINT "scenario_outcomes_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_outcomes" ADD CONSTRAINT "scenario_outcomes_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tier_id_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary_progress" ADD CONSTRAINT "vocabulary_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary_progress" ADD CONSTRAINT "vocabulary_progress_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;