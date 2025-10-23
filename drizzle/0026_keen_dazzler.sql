DO $$ BEGIN
 CREATE TYPE "public"."speech_speed_enum" AS ENUM('auto', 'very_slow', 'slow', 'normal', 'fast', 'native');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "speech_speed" "speech_speed_enum" DEFAULT 'slow' NOT NULL;