CREATE TYPE "public"."weekly_analysis_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."learning_path_mode" AS ENUM('classic', 'adaptive');--> statement-breakpoint
CREATE TYPE "public"."session_type_category" AS ENUM('warmup', 'practice', 'challenge', 'review');--> statement-breakpoint
CREATE TYPE "public"."adaptive_week_status" AS ENUM('locked', 'active', 'completed', 'skipped');--> statement-breakpoint
CREATE TABLE "adaptive_weeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path_id" text NOT NULL,
	"week_number" integer NOT NULL,
	"theme" text NOT NULL,
	"theme_description" text NOT NULL,
	"difficulty_min" text NOT NULL,
	"difficulty_max" text NOT NULL,
	"status" "adaptive_week_status" DEFAULT 'locked' NOT NULL,
	"is_anchor_week" boolean DEFAULT false NOT NULL,
	"conversation_seeds" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"focus_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"leverage_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suggested_session_count" integer DEFAULT 5 NOT NULL,
	"minimum_session_count" integer DEFAULT 3 NOT NULL,
	"unlocks_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"generated_from_analysis_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"description" text NOT NULL,
	"category" "session_type_category" NOT NULL,
	"duration_minutes_min" integer NOT NULL,
	"duration_minutes_max" integer NOT NULL,
	"target_exchanges" integer NOT NULL,
	"prompt_hints" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "week_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"week_id" uuid NOT NULL,
	"sessions_completed" integer DEFAULT 0 NOT NULL,
	"total_minutes" numeric(8, 2) DEFAULT '0' NOT NULL,
	"session_types_used" integer DEFAULT 0 NOT NULL,
	"seeds_explored" integer DEFAULT 0 NOT NULL,
	"average_comfort_rating" numeric(3, 2),
	"sessions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"session_type_ids_used" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"seed_ids_explored" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"vocabulary_encounters" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"grammar_encounters" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"topics_that_sparked_joy" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"topics_that_were_challenging" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active_days_this_week" integer DEFAULT 0 NOT NULL,
	"current_streak_days" integer DEFAULT 0 NOT NULL,
	"longest_streak_this_week" integer DEFAULT 0 NOT NULL,
	"last_session_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "week_progress_user_week_unique" UNIQUE("user_id","week_id")
);
--> statement-breakpoint
CREATE TABLE "week_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_progress_id" uuid NOT NULL,
	"conversation_id" text NOT NULL,
	"session_type_id" text NOT NULL,
	"conversation_seed_id" text,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"duration_seconds" integer,
	"exchange_count" integer DEFAULT 0 NOT NULL,
	"comfort_rating" integer,
	"mood" text,
	"user_reflection" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"week_id" uuid NOT NULL,
	"week_progress_id" uuid NOT NULL,
	"status" "weekly_analysis_status" DEFAULT 'pending' NOT NULL,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"total_minutes" numeric(8, 2) DEFAULT '0' NOT NULL,
	"average_comfort" numeric(3, 2),
	"active_days" integer DEFAULT 0 NOT NULL,
	"strengths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"challenges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"topic_affinities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_session_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generated_seeds" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suggested_next_theme" text,
	"suggested_difficulty_adjustment" text,
	"week_summary" text,
	"encouragement_message" text,
	"next_week_preview" text,
	"processing_started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"generated_week_id" uuid,
	"raw_ai_response" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_path_assignments" ADD COLUMN "current_week_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD COLUMN "mode" "learning_path_mode" DEFAULT 'classic' NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD COLUMN "duration_weeks" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "adaptive_weeks" ADD CONSTRAINT "adaptive_weeks_path_id_learning_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_paths"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_progress" ADD CONSTRAINT "week_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_progress" ADD CONSTRAINT "week_progress_assignment_id_learning_path_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."learning_path_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_progress" ADD CONSTRAINT "week_progress_week_id_adaptive_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."adaptive_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_sessions" ADD CONSTRAINT "week_sessions_week_progress_id_week_progress_id_fk" FOREIGN KEY ("week_progress_id") REFERENCES "public"."week_progress"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_sessions" ADD CONSTRAINT "week_sessions_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_sessions" ADD CONSTRAINT "week_sessions_session_type_id_session_types_id_fk" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_analysis" ADD CONSTRAINT "weekly_analysis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_analysis" ADD CONSTRAINT "weekly_analysis_assignment_id_learning_path_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."learning_path_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_analysis" ADD CONSTRAINT "weekly_analysis_week_id_adaptive_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."adaptive_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_analysis" ADD CONSTRAINT "weekly_analysis_week_progress_id_week_progress_id_fk" FOREIGN KEY ("week_progress_id") REFERENCES "public"."week_progress"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "adaptive_weeks_path_id_idx" ON "adaptive_weeks" USING btree ("path_id");--> statement-breakpoint
CREATE INDEX "adaptive_weeks_week_number_idx" ON "adaptive_weeks" USING btree ("week_number");--> statement-breakpoint
CREATE INDEX "adaptive_weeks_status_idx" ON "adaptive_weeks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "adaptive_weeks_unlocks_at_idx" ON "adaptive_weeks" USING btree ("unlocks_at");--> statement-breakpoint
CREATE INDEX "adaptive_weeks_path_status_idx" ON "adaptive_weeks" USING btree ("path_id","status");--> statement-breakpoint
CREATE INDEX "adaptive_weeks_path_week_idx" ON "adaptive_weeks" USING btree ("path_id","week_number");--> statement-breakpoint
CREATE INDEX "session_types_category_idx" ON "session_types" USING btree ("category");--> statement-breakpoint
CREATE INDEX "session_types_is_active_idx" ON "session_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "session_types_display_order_idx" ON "session_types" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "week_progress_user_id_idx" ON "week_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "week_progress_assignment_id_idx" ON "week_progress" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "week_progress_week_id_idx" ON "week_progress" USING btree ("week_id");--> statement-breakpoint
CREATE INDEX "week_progress_last_session_idx" ON "week_progress" USING btree ("last_session_at");--> statement-breakpoint
CREATE INDEX "week_progress_user_assignment_idx" ON "week_progress" USING btree ("user_id","assignment_id");--> statement-breakpoint
CREATE INDEX "week_sessions_week_progress_idx" ON "week_sessions" USING btree ("week_progress_id");--> statement-breakpoint
CREATE INDEX "week_sessions_conversation_idx" ON "week_sessions" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "week_sessions_session_type_idx" ON "week_sessions" USING btree ("session_type_id");--> statement-breakpoint
CREATE INDEX "week_sessions_started_at_idx" ON "week_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "week_sessions_week_time_idx" ON "week_sessions" USING btree ("week_progress_id","started_at");--> statement-breakpoint
CREATE INDEX "weekly_analysis_user_id_idx" ON "weekly_analysis" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "weekly_analysis_assignment_id_idx" ON "weekly_analysis" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "weekly_analysis_week_id_idx" ON "weekly_analysis" USING btree ("week_id");--> statement-breakpoint
CREATE INDEX "weekly_analysis_status_idx" ON "weekly_analysis" USING btree ("status");--> statement-breakpoint
CREATE INDEX "weekly_analysis_completed_at_idx" ON "weekly_analysis" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "weekly_analysis_pending_idx" ON "weekly_analysis" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "learning_paths_mode_idx" ON "learning_paths" USING btree ("mode");--> statement-breakpoint
CREATE INDEX "learning_paths_mode_status_idx" ON "learning_paths" USING btree ("mode","status");