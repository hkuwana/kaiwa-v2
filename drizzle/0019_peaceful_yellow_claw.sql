ALTER TABLE "user_settings" ADD COLUMN "receive_product_updates" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "receive_weekly_digest" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "receive_security_alerts" boolean DEFAULT true NOT NULL;