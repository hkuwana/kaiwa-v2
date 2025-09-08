DROP INDEX "messages_pinyin_idx";--> statement-breakpoint
DROP INDEX "messages_kanji_idx";--> statement-breakpoint
DROP INDEX "messages_script_support_idx";--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "recent_session_scores" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "skill_level_history" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "audio_settings" jsonb;--> statement-breakpoint
CREATE INDEX "messages_script_support_idx" ON "messages" USING btree ("source_language","romanization","hiragana");--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "pinyin";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "katakana";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "kanji";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "hangul";