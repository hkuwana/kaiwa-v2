import { pgTable, uuid, text, timestamp, decimal, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { subscriptions } from './subscriptions';

// Payment history for analytics
export const payments = pgTable(
	'payments',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),
		subscriptionId: uuid('subscription_id').references(() => subscriptions.id),

		// Stripe payment data
		stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
		stripeInvoiceId: text('stripe_invoice_id').unique(),

		// Payment details
		amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
		currency: text('currency').notNull().default('usd'),
		status: text('status').notNull(), // succeeded, failed, pending

		// Metadata
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [
		// Performance indexes for payment queries
		index('payments_user_id_idx').on(table.userId),
		index('payments_subscription_id_idx').on(table.subscriptionId),
		index('payments_status_idx').on(table.status),
		index('payments_currency_idx').on(table.currency),
		index('payments_created_at_idx').on(table.createdAt),
		// Composite index for user + status queries
		index('payments_user_status_idx').on(table.userId, table.status)
	]
);
