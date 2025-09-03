ALTER TABLE "tiers" ADD COLUMN "max_memories" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "memories" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "tiers" DROP COLUMN "max_conversation_summary_length";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "conversation_summary";