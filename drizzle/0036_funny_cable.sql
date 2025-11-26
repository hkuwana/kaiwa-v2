CREATE TYPE "public"."preview_status" AS ENUM('generating', 'ready', 'committed');--> statement-breakpoint
CREATE TABLE "learning_path_previews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"intent" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_language" text NOT NULL,
	"source_language" text DEFAULT 'en' NOT NULL,
	"schedule" jsonb NOT NULL,
	"preview_scenarios" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "preview_status" DEFAULT 'generating' NOT NULL,
	"committed_path_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "learning_path_previews_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "learning_path_previews" ADD CONSTRAINT "learning_path_previews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "learning_path_previews_user_id_idx" ON "learning_path_previews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "learning_path_previews_session_id_idx" ON "learning_path_previews" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "learning_path_previews_status_idx" ON "learning_path_previews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "learning_path_previews_expires_at_idx" ON "learning_path_previews" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "learning_path_previews_committed_path_idx" ON "learning_path_previews" USING btree ("committed_path_id");--> statement-breakpoint
CREATE INDEX "learning_path_previews_user_status_idx" ON "learning_path_previews" USING btree ("user_id","status");