import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { tiers } from './tiers';

// Stripe subscriptions
export const subscriptions = pgTable('subscriptions', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),

	// Stripe data
	stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
	stripeCustomerId: text('stripe_customer_id').notNull(),
	stripePriceId: text('stripe_price_id').notNull(),

	// Subscription details
	status: text('status').notNull(), // active, canceled, past_due, etc.
	currentPeriodStart: timestamp('current_period_start').notNull(),
	currentPeriodEnd: timestamp('current_period_end').notNull(),
	cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),

	// Tier mapping
	tierId: text('tier_id')
		.notNull()
		.references(() => tiers.id),

	// Metadata
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});
