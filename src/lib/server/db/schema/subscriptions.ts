import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { tiers } from './tiers';

// Stripe subscriptions - single source of truth for subscription data
export const subscriptions = pgTable(
	'subscriptions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),

		// Stripe data
		stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
		stripeCustomerId: text('stripe_customer_id').notNull(),
		stripePriceId: text('stripe_price_id').notNull(),

		// Subscription details
		status: text('status').notNull(), // active, canceled, past_due, trialing, etc.
		currentPeriodStart: timestamp('current_period_start').notNull(),
		currentPeriodEnd: timestamp('current_period_end').notNull(),
		cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),

		// Tier mapping
		tierId: text('tier_id')
			.notNull()
			.references(() => tiers.id),

		// Computed fields for easy access
		isActive: boolean('is_active').default(false), // Computed from status
		effectiveTier: text('effective_tier'), // Computed tier (can be different from tierId during transitions)

		// Metadata
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		// Performance indexes for subscription queries
		index('subscriptions_user_id_idx').on(table.userId),
		index('subscriptions_status_idx').on(table.status),
		index('subscriptions_tier_id_idx').on(table.tierId),
		index('subscriptions_is_active_idx').on(table.isActive),
		index('subscriptions_current_period_end_idx').on(table.currentPeriodEnd),
		// Composite index for user + status queries
		index('subscriptions_user_status_idx').on(table.userId, table.status),
		// Index for cleanup queries
		index('subscriptions_updated_at_idx').on(table.updatedAt)
	]
);
