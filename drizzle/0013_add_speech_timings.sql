-- Add speech_timings column to messages table
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "speech_timings" jsonb;
