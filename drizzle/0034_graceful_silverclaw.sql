ALTER TABLE "user_preferences" ALTER COLUMN "audio_input_mode" SET DEFAULT 'ptt';--> statement-breakpoint
ALTER TABLE "speakers" ADD COLUMN "character_image_url" text;--> statement-breakpoint
ALTER TABLE "speakers" ADD COLUMN "character_image_alt" text;