DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_type
		WHERE typname = 'audio_input_mode_enum'
	) THEN
		CREATE TYPE "audio_input_mode_enum" AS ENUM ('vad', 'ptt');
	END IF;
END;
$$;

ALTER TABLE "user_preferences" ADD COLUMN "audio_input_mode" "audio_input_mode_enum" DEFAULT 'vad' NOT NULL;
