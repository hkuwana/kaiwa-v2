ALTER TABLE "tiers" ADD COLUMN "daily_conversations" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "tiers" ADD COLUMN "daily_seconds" integer DEFAULT 180;--> statement-breakpoint
ALTER TABLE "tiers" ADD COLUMN "daily_analyses" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "tiers" ADD COLUMN "has_deep_analysis" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_usage" ADD COLUMN "analyses_used" integer DEFAULT 0;