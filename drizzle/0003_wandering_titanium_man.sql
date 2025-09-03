CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" text,
	"event_name" text NOT NULL,
	"properties" json,
	"user_agent" text,
	"ip_address" text,
	"referrer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scenario_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"completed_steps" json,
	"abandoned_at" text,
	"time_spent_seconds" integer,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"translations_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" RENAME COLUMN "daily_goal_minutes" TO "daily_goal_seconds";--> statement-breakpoint
ALTER TABLE "user_preferences" RENAME COLUMN "confidence_level" TO "speaking_confidence";--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "successful_exchanges" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "comfort_zone" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "conversation_context" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_required" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification" ADD CONSTRAINT "email_verification_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_attempts" ADD CONSTRAINT "scenario_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_attempts" ADD CONSTRAINT "scenario_attempts_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_outcomes" ADD CONSTRAINT "scenario_outcomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_outcomes" ADD CONSTRAINT "scenario_outcomes_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_outcomes" ADD CONSTRAINT "scenario_outcomes_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_verification_user_id_idx" ON "email_verification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_email_idx" ON "email_verification" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_verification_code_idx" ON "email_verification" USING btree ("code");--> statement-breakpoint
CREATE INDEX "email_verification_expires_at_idx" ON "email_verification" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "total_study_time_minutes";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "total_conversations";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "current_streak_days";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "last_studied";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "recent_session_scores";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "last_assessment_date";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "skill_level_history";