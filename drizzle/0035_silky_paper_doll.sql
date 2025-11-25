CREATE TYPE "public"."assignment_role" AS ENUM('tester', 'learner');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('invited', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."learning_path_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."queue_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "learning_path_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "assignment_role" DEFAULT 'learner' NOT NULL,
	"status" "assignment_status" DEFAULT 'invited' NOT NULL,
	"starts_at" timestamp NOT NULL,
	"current_day_index" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"email_reminders_enabled" boolean DEFAULT true NOT NULL,
	"last_email_sent_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_user_path_unique" UNIQUE("user_id","path_id")
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_language" text NOT NULL,
	"schedule" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"share_slug" text,
	"status" "learning_path_status" DEFAULT 'active' NOT NULL,
	"created_by_user_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_generation_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path_id" text NOT NULL,
	"day_index" integer NOT NULL,
	"target_generation_date" timestamp NOT NULL,
	"status" "queue_status" DEFAULT 'pending' NOT NULL,
	"last_error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scenarios" ALTER COLUMN "estimated_duration_seconds" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "learning_path_assignments" ADD CONSTRAINT "learning_path_assignments_path_id_learning_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_paths"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_assignments" ADD CONSTRAINT "learning_path_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_generation_queue" ADD CONSTRAINT "scenario_generation_queue_path_id_learning_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_paths"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignments_user_id_idx" ON "learning_path_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assignments_path_id_idx" ON "learning_path_assignments" USING btree ("path_id");--> statement-breakpoint
CREATE INDEX "assignments_status_idx" ON "learning_path_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assignments_role_idx" ON "learning_path_assignments" USING btree ("role");--> statement-breakpoint
CREATE INDEX "assignments_starts_at_idx" ON "learning_path_assignments" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "assignments_user_active_idx" ON "learning_path_assignments" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "assignments_path_testers_idx" ON "learning_path_assignments" USING btree ("path_id","role","status");--> statement-breakpoint
CREATE INDEX "assignments_email_ready_idx" ON "learning_path_assignments" USING btree ("status","email_reminders_enabled");--> statement-breakpoint
CREATE INDEX "learning_paths_user_id_idx" ON "learning_paths" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "learning_paths_is_template_idx" ON "learning_paths" USING btree ("is_template");--> statement-breakpoint
CREATE INDEX "learning_paths_is_public_idx" ON "learning_paths" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "learning_paths_status_idx" ON "learning_paths" USING btree ("status");--> statement-breakpoint
CREATE INDEX "learning_paths_share_slug_idx" ON "learning_paths" USING btree ("share_slug");--> statement-breakpoint
CREATE INDEX "learning_paths_target_language_idx" ON "learning_paths" USING btree ("target_language");--> statement-breakpoint
CREATE INDEX "learning_paths_public_templates_idx" ON "learning_paths" USING btree ("is_template","is_public");--> statement-breakpoint
CREATE INDEX "learning_paths_user_active_idx" ON "learning_paths" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "learning_paths_creator_idx" ON "learning_paths" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "scenario_queue_path_id_idx" ON "scenario_generation_queue" USING btree ("path_id");--> statement-breakpoint
CREATE INDEX "scenario_queue_status_idx" ON "scenario_generation_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scenario_queue_target_date_idx" ON "scenario_generation_queue" USING btree ("target_generation_date");--> statement-breakpoint
CREATE INDEX "scenario_queue_pending_target_idx" ON "scenario_generation_queue" USING btree ("status","target_generation_date");--> statement-breakpoint
CREATE INDEX "scenario_queue_path_day_idx" ON "scenario_generation_queue" USING btree ("path_id","day_index");--> statement-breakpoint
CREATE INDEX "scenario_queue_failed_idx" ON "scenario_generation_queue" USING btree ("status","updated_at");