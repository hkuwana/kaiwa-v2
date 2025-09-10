ALTER TABLE "user_preferences" ALTER COLUMN "preferred_voice" SET DEFAULT 'sage';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "sequence_id" text;--> statement-breakpoint
CREATE INDEX "messages_sequence_idx" ON "messages" USING btree ("sequence_id");