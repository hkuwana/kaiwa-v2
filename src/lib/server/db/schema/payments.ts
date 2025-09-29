import { pgTable, uuid, text, timestamp, decimal, index, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { subscriptions } from './subscriptions';

/**
 * Payment status enumeration for type safety
 */
export const paymentStatusEnum = pgEnum('payment_status', [
	'succeeded',
	'failed',
	'pending',
	'canceled',
	'requires_payment_method',
	'requires_confirmation'
]);

/**
 * Payments table - Records payment transaction history
 *
 * This table stores a record of all payment transactions made by users.
 * It tracks payment amounts, currencies, status (succeeded/failed/pending),
 * and links to Stripe payment intents and invoices for reconciliation.
 * Used for analytics, revenue tracking, and customer support.
 *
 * **Key Features:**
 * - Complete audit trail of all payment attempts
 * - Stripe integration for payment processing
 * - Support for multiple currencies
 * - Detailed status tracking for customer support
 *
 * @example
 * ```typescript
 * // Record a successful payment
 * await db.insert(payments).values({
 *   userId: 'user-123',
 *   subscriptionId: 'sub-456',
 *   stripePaymentIntentId: 'pi_1234567890',
 *   amount: '9.99',
 *   currency: 'usd',
 *   status: 'succeeded'
 * });
 * ```
 */
export const payments = pgTable(
	'payments',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		subscriptionId: uuid('subscription_id').references(() => subscriptions.id, {
			onDelete: 'set null'
		}),

		stripePaymentIntentId: text('stripe_payment_intent_id').unique(),

		stripeInvoiceId: text('stripe_invoice_id').unique(),

		amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),

		currency: text('currency').notNull().default('usd'),

		status: paymentStatusEnum('status').notNull(),

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
		index('payments_user_status_idx').on(table.userId, table.status),
		// Index for Stripe reconciliation
		index('payments_stripe_payment_intent_idx').on(table.stripePaymentIntentId),
		// Index for revenue analytics
		index('payments_amount_currency_idx').on(table.amount, table.currency)
	]
);
