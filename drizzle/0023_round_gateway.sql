CREATE TABLE IF NOT EXISTS "message_audio_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" text NOT NULL,
	"analyzed_at" timestamp DEFAULT now() NOT NULL,
	"analysis_version" text DEFAULT '1.0' NOT NULL,
	"overall_accuracy_score" integer,
	"overall_fluency_score" integer,
	"speech_rate_wpm" integer,
	"articulation_rate_wpm" integer,
	"total_speech_duration_ms" integer,
	"total_pause_duration_ms" integer,
	"pause_count" integer,
	"hesitation_count" integer,
	"average_pause_duration_ms" integer,
	"longest_pause_duration_ms" integer,
	"speech_timings" jsonb,
	"phoneme_analysis" jsonb,
	"problematic_words" jsonb,
	"recommendations" jsonb,
	"practice_words" jsonb,
	"raw_alignment" jsonb,
	"raw_features" jsonb,
	"analysis_engine" text DEFAULT 'echogarden',
	"analysis_model_version" text,
	"analysis_language" text,
	"analysis_duration_ms" integer,
	"analysis_error" text,
	"analysis_warnings" jsonb,
	CONSTRAINT "message_audio_analysis_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" RENAME COLUMN "audio_duration" TO "audio_duration_ms";
EXCEPTION
	WHEN undefined_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ALTER COLUMN "pronunciation_score" SET DATA TYPE integer;
EXCEPTION
	WHEN others THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD COLUMN "audio_url_expires_at" timestamp;
EXCEPTION
	WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD COLUMN "audio_storage_key" text;
EXCEPTION
	WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD COLUMN "audio_size_bytes" integer;
EXCEPTION
	WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD COLUMN "audio_format" text;
EXCEPTION
	WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD COLUMN "audio_sample_rate" integer DEFAULT 24000;
EXCEPTION
	WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD COLUMN "audio_channels" integer DEFAULT 1;
EXCEPTION
	WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD COLUMN "audio_processing_state" text DEFAULT 'pending';
EXCEPTION
	WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD COLUMN "audio_processing_error" text;
EXCEPTION
	WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD COLUMN "audio_retention_expires_at" timestamp;
EXCEPTION
	WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD COLUMN "audio_deleted_at" timestamp;
EXCEPTION
	WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD COLUMN "fluency_score" integer;
EXCEPTION
	WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "messages" ADD COLUMN "speech_rate_wpm" integer;
EXCEPTION
	WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "message_audio_analysis" ADD CONSTRAINT "message_audio_analysis_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_audio_analysis_message_id_idx" ON "message_audio_analysis" USING btree ("message_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_audio_analysis_analyzed_at_idx" ON "message_audio_analysis" USING btree ("analyzed_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_audio_analysis_accuracy_idx" ON "message_audio_analysis" USING btree ("overall_accuracy_score");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_audio_analysis_fluency_idx" ON "message_audio_analysis" USING btree ("overall_fluency_score");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_audio_analysis_engine_idx" ON "message_audio_analysis" USING btree ("analysis_engine","analysis_version");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_audio_analysis_language_idx" ON "message_audio_analysis" USING btree ("analysis_language");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_audio_storage_idx" ON "messages" USING btree ("audio_storage_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_audio_processing_idx" ON "messages" USING btree ("audio_processing_state");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_audio_retention_idx" ON "messages" USING btree ("audio_retention_expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_pronunciation_idx" ON "messages" USING btree ("pronunciation_score","fluency_score");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_audio_cleanup_idx" ON "messages" USING btree ("audio_retention_expires_at","audio_deleted_at");
--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN IF EXISTS "speech_timings";
