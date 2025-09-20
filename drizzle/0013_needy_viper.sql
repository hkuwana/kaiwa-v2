CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"audio_settings" jsonb,
	"receive_marketing_emails" boolean DEFAULT true NOT NULL,
	"receive_daily_reminder_emails" boolean DEFAULT true NOT NULL,
	"daily_reminder_sent_count" integer DEFAULT 0 NOT NULL,
	"last_reminder_sent_at" timestamp,
	"theme" text DEFAULT 'system' NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "audio_settings";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "receive_marketing_emails";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "receive_daily_reminder_emails";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "daily_reminder_sent_count";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "last_reminder_sent_at";