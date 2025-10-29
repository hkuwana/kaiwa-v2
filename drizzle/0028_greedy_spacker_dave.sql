CREATE TYPE "public"."scenario_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "scenario_metadata" (
	"scenario_id" text PRIMARY KEY NOT NULL,
	"amount_saved_count" integer DEFAULT 0 NOT NULL,
	"total_times_used" integer DEFAULT 0 NOT NULL,
	"total_attempts" integer DEFAULT 0 NOT NULL,
	"average_rating" real,
	"ratings_count" integer DEFAULT 0 NOT NULL,
	"completion_rate" real,
	"average_time_spent" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_scenario_progress" (
	"user_id" uuid NOT NULL,
	"scenario_id" text NOT NULL,
	"is_saved" boolean DEFAULT false NOT NULL,
	"saved_at" timestamp,
	"times_completed" integer DEFAULT 0 NOT NULL,
	"times_attempted" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp,
	"last_completed_at" timestamp,
	"total_time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"user_rating" integer,
	"user_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_scenario_progress_user_id_scenario_id_pk" PRIMARY KEY("user_id","scenario_id")
);
--> statement-breakpoint
ALTER TABLE "scenario_attempts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "scenario_outcomes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "scenario_attempts" CASCADE;--> statement-breakpoint
DROP TABLE "scenario_outcomes" CASCADE;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "difficulty_rating" integer;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "cefr_level" text;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "learning_goal" text;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "cefr_recommendation" text;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "visibility" "scenario_visibility" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "scenarios" ADD COLUMN "usage_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ADD COLUMN "max_custom_scenarios" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ADD COLUMN "max_private_custom_scenarios" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "scenario_metadata" ADD CONSTRAINT "scenario_metadata_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_scenario_progress" ADD CONSTRAINT "user_scenario_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_scenario_progress" ADD CONSTRAINT "user_scenario_progress_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scenario_metadata_saved_count_idx" ON "scenario_metadata" USING btree ("amount_saved_count");--> statement-breakpoint
CREATE INDEX "scenario_metadata_times_used_idx" ON "scenario_metadata" USING btree ("total_times_used");--> statement-breakpoint
CREATE INDEX "scenario_metadata_rating_idx" ON "scenario_metadata" USING btree ("average_rating");--> statement-breakpoint
CREATE INDEX "user_progress_user_idx" ON "user_scenario_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_progress_scenario_idx" ON "user_scenario_progress" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "user_saved_scenarios_idx" ON "user_scenario_progress" USING btree ("user_id","is_saved");--> statement-breakpoint
CREATE INDEX "user_completed_idx" ON "user_scenario_progress" USING btree ("user_id","last_completed_at");--> statement-breakpoint
CREATE INDEX "scenario_saved_users_idx" ON "user_scenario_progress" USING btree ("scenario_id","is_saved");--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scenarios_user_visibility_idx" ON "scenarios" USING btree ("created_by_user_id","visibility");--> statement-breakpoint
CREATE INDEX "scenarios_user_active_idx" ON "scenarios" USING btree ("created_by_user_id","is_active");