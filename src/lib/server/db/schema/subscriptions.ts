import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Subscriptions table - Tracks user subscription status as backup to Stripe
 *
 * This table maintains a local copy of user subscription information for quick access,
 * while Stripe remains the source of truth. It stores the current tier (free/plus/premium),
 * Stripe subscription and price IDs, and sync timestamps. Used to quickly check
 * user access levels without making external API calls to Stripe.
 */
export const subscriptions = pgTable(
	'subscriptions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),

		// Minimal Stripe references for backup
		stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
		stripePriceId: text('stripe_price_id').notNull(),

		// Current tier (synced from Stripe, used as backup)
		currentTier: text('current_tier').notNull().default('free'), // 'free', 'plus', 'premium'

		// Metadata
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		// Minimal indexes for essential queries
		index('subscriptions_user_id_idx').on(table.userId),
		index('subscriptions_current_tier_idx').on(table.currentTier),
		index('subscriptions_updated_at_idx').on(table.updatedAt)
	]
);
