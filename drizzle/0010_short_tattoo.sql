ALTER TABLE "user_usage" ADD COLUMN "anki_exports_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "session_extensions_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "advanced_voice_seconds" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "completed_sessions" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "longest_session_seconds" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "average_session_seconds" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "overage_seconds" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "tier_when_used" text DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "last_conversation_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "last_realtime_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "first_activity_at" timestamp;