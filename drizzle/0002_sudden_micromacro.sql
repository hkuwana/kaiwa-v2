ALTER TABLE "tiers" RENAME COLUMN "conversation_timeout_ms" TO "conversation_timeout_seconds";--> statement-breakpoint
ALTER TABLE "tiers" RENAME COLUMN "warning_threshold_ms" TO "warning_threshold_seconds";--> statement-breakpoint
ALTER TABLE "tiers" RENAME COLUMN "extension_duration_ms" TO "extension_duration_seconds";--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "max_session_length_seconds" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "session_banking_enabled" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "max_banked_seconds" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "has_realtime_access" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "has_advanced_voices" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "has_analytics" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "has_custom_phrases" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "has_conversation_memory" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "has_anki_export" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "monthly_price_usd" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "annual_price_usd" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "can_extend" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ALTER COLUMN "max_extensions" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "languages" ADD COLUMN "flag" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ADD COLUMN "overage_price_per_minute_in_cents" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ADD COLUMN "feedback_sessions_per_month" text DEFAULT 'unlimited' NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ADD COLUMN "customized_phrases_frequency" text DEFAULT 'weekly' NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ADD COLUMN "conversation_memory_level" text DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE "tiers" ADD COLUMN "anki_export_limit" integer DEFAULT -1 NOT NULL;