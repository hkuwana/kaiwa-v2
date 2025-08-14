import { pgTable, uuid, text, timestamp, decimal } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { subscriptions } from './subscriptions.js';

// Payment history for analytics
export const payments = pgTable('payments', {
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
});
