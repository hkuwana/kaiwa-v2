ALTER TABLE "conversation_sessions" ALTER COLUMN "device_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."device_type";