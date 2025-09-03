ALTER TABLE "tiers" ADD COLUMN "max_conversation_summary_length" integer DEFAULT 2000 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "conversation_summary" text;