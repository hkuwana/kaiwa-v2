ALTER TABLE "conversation_sessions" RENAME COLUMN "duration_minutes" TO "duration_seconds";--> statement-breakpoint
ALTER TABLE "conversation_sessions" RENAME COLUMN "minutes_consumed" TO "seconds_consumed";--> statement-breakpoint
DROP INDEX "conversation_sessions_duration_idx";--> statement-breakpoint
ALTER TABLE "conversation_sessions" ADD COLUMN "input_tokens" integer DEFAULT 0;--> statement-breakpoint
CREATE INDEX "conversation_sessions_duration_idx" ON "conversation_sessions" USING btree ("duration_seconds");