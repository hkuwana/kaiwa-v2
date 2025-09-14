ALTER TABLE "subscriptions" RENAME COLUMN "effective_tier" TO "current_tier";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_stripe_metered_subscription_item_id_unique";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_tier_id_tiers_id_fk";
--> statement-breakpoint
DROP INDEX "subscriptions_status_idx";--> statement-breakpoint
DROP INDEX "subscriptions_tier_id_idx";--> statement-breakpoint
DROP INDEX "subscriptions_is_active_idx";--> statement-breakpoint
DROP INDEX "subscriptions_current_period_end_idx";--> statement-breakpoint
DROP INDEX "subscriptions_user_status_idx";--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "receive_marketing_emails" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "receive_daily_reminder_emails" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "daily_reminder_sent_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "last_reminder_sent_at" timestamp;--> statement-breakpoint
CREATE INDEX "subscriptions_current_tier_idx" ON "subscriptions" USING btree ("current_tier");--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "stripe_customer_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "stripe_metered_subscription_item_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "current_period_start";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "current_period_end";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "cancel_at_period_end";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "tier_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "is_active";