import { pgTable, uuid, text, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Subscription tier enumeration for type safety
 */
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'plus', 'premium']);

/**
 * 💳 Subscriptions table - Tracks user subscription status as backup to Stripe
 *
 * This table maintains a local copy of user subscription information for quick access,
 * while Stripe remains the source of truth. It stores the current tier (free/plus/premium),
 * Stripe subscription and price IDs, and sync timestamps. Used to quickly check
 * user access levels without making external API calls to Stripe.
 *
 * **Key Features:**
 * - ⚡ Fast local access to subscription data
 * - 🔄 Stripe synchronization for data consistency
 * - 📊 Tier-based feature access control
 * - 💰 Revenue tracking and analytics
 * - 🔒 Secure subscription management
 *
 * **Important Notes:**
 * - 🎯 Stripe is the source of truth for billing
 * - 🔄 This table is synced periodically with Stripe
 * - ⚠️ Always verify critical operations with Stripe API
 *
 * @example
 * ```typescript
 * // Create a new subscription
 * await db.insert(subscriptions).values({
 *   userId: 'user-123',
 *   stripeSubscriptionId: 'sub_1234567890',
 *   stripePriceId: 'price_1234567890',
 *   currentTier: 'plus'
 * });
 * ```
 */
export const subscriptions = pgTable(
	'subscriptions',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),

		stripePriceId: text('stripe_price_id').notNull(),

		currentTier: subscriptionTierEnum('current_tier').notNull().default('free'),

		createdAt: timestamp('created_at').defaultNow(),

		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		// Performance indexes for subscription queries
		index('subscriptions_user_id_idx').on(table.userId),
		index('subscriptions_current_tier_idx').on(table.currentTier),
		index('subscriptions_updated_at_idx').on(table.updatedAt),
		index('subscriptions_stripe_subscription_idx').on(table.stripeSubscriptionId),
		index('subscriptions_stripe_price_idx').on(table.stripePriceId),
		// Composite index for user tier queries
		index('subscriptions_user_tier_idx').on(table.userId, table.currentTier)
	]
);
