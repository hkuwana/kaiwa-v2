// src/lib/server/repositories/payment.repository.ts

import { db } from '$lib/server/db/index';
import { payments } from '$lib/server/db/schema';
import type { NewPayment, Payment } from '$lib/server/db/types';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

function buildConflictUpdate(newPayment: NewPayment) {
	return {
		status: newPayment.status,
		amount: newPayment.amount,
		currency: newPayment.currency,
		subscriptionId: newPayment.subscriptionId ?? null,
		userId: newPayment.userId
	};
}

export const paymentRepository = {
	// CREATE
	async createPayment(newPayment: NewPayment): Promise<Payment> {
		const baseInsert = db.insert(payments).values(newPayment);

		if (newPayment.stripePaymentIntentId) {
			const [createdPayment] = await baseInsert
				.onConflictDoUpdate({
					target: payments.stripePaymentIntentId,
					set: buildConflictUpdate(newPayment)
				})
				.returning();

			return createdPayment;
		}

		if (newPayment.stripeInvoiceId) {
			const [createdPayment] = await baseInsert
				.onConflictDoUpdate({
					target: payments.stripeInvoiceId,
					set: buildConflictUpdate(newPayment)
				})
				.returning();

			return createdPayment;
		}

		const [createdPayment] = await baseInsert.returning();

		return createdPayment;
	},

	// READ
	async findPaymentById(id: string): Promise<Payment | undefined> {
		return db.query.payments.findFirst({ where: eq(payments.id, id) });
	},

	async findPaymentByStripePaymentIntentId(
		stripePaymentIntentId: string
	): Promise<Payment | undefined> {
		return db.query.payments.findFirst({
			where: eq(payments.stripePaymentIntentId, stripePaymentIntentId)
		});
	},

	async findPaymentByStripeInvoiceId(stripeInvoiceId: string): Promise<Payment | undefined> {
		return db.query.payments.findFirst({
			where: eq(payments.stripeInvoiceId, stripeInvoiceId)
		});
	},

	async findPaymentsByUserId(userId: string): Promise<Payment[]> {
		return db.query.payments.findMany({
			where: eq(payments.userId, userId),
			orderBy: [desc(payments.createdAt)]
		});
	},

	async findPaymentsBySubscriptionId(subscriptionId: string): Promise<Payment[]> {
		return db.query.payments.findMany({
			where: eq(payments.subscriptionId, subscriptionId),
			orderBy: [desc(payments.createdAt)]
		});
	},

	async findPaymentsByStatus(
		status:
			| 'succeeded'
			| 'failed'
			| 'pending'
			| 'canceled'
			| 'requires_payment_method'
			| 'requires_confirmation'
	): Promise<Payment[]> {
		return db.query.payments.findMany({
			where: eq(payments.status, status),
			orderBy: [desc(payments.createdAt)]
		});
	},

	async findPaymentsInDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
		return db.query.payments.findMany({
			where: and(gte(payments.createdAt, startDate), lte(payments.createdAt, endDate)),
			orderBy: [desc(payments.createdAt)]
		});
	},

	// UPDATE
	async updatePayment(id: string, data: Partial<NewPayment>): Promise<Payment | undefined> {
		const [updatedPayment] = await db
			.update(payments)
			.set(data)
			.where(eq(payments.id, id))
			.returning();

		return updatedPayment;
	},

	async updatePaymentStatus(
		id: string,
		status:
			| 'succeeded'
			| 'failed'
			| 'pending'
			| 'canceled'
			| 'requires_payment_method'
			| 'requires_confirmation'
	): Promise<Payment | undefined> {
		const [updatedPayment] = await db
			.update(payments)
			.set({ status })
			.where(eq(payments.id, id))
			.returning();

		return updatedPayment;
	},

	// DELETE
	async deletePayment(id: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(payments)
			.where(eq(payments.id, id))
			.returning({ id: payments.id });

		return { success: result.length > 0 };
	},

	async deleteUserPayments(userId: string): Promise<number> {
		const result = await db
			.delete(payments)
			.where(eq(payments.userId, userId))
			.returning({ id: payments.id });

		return result.length;
	},

	// UTILITY METHODS
	async getPaymentStats(
		periodStart: Date,
		periodEnd: Date
	): Promise<{
		totalPayments: number;
		totalAmount: number;
		successfulPayments: number;
		failedPayments: number;
		averagePaymentAmount: number;
	}> {
		const result = await db
			.select({
				totalPayments: payments.id,
				amount: payments.amount,
				status: payments.status
			})
			.from(payments)
			.where(and(gte(payments.createdAt, periodStart), lte(payments.createdAt, periodEnd)));

		const totalPayments = result.length;
		const successfulPayments = result.filter((p) => p.status === 'succeeded').length;
		const failedPayments = result.filter((p) => p.status === 'failed').length;

		const totalAmount = result
			.filter((p) => p.status === 'succeeded')
			.reduce((sum, p) => sum + Number(p.amount), 0);

		const averagePaymentAmount = successfulPayments > 0 ? totalAmount / successfulPayments : 0;

		return {
			totalPayments,
			totalAmount,
			successfulPayments,
			failedPayments,
			averagePaymentAmount
		};
	},

	async getRevenueByCurrency(
		periodStart: Date,
		periodEnd: Date
	): Promise<
		{
			currency: string;
			totalAmount: number;
			paymentCount: number;
		}[]
	> {
		const result = await db
			.select({
				currency: payments.currency,
				amount: payments.amount,
				status: payments.status
			})
			.from(payments)
			.where(
				and(
					gte(payments.createdAt, periodStart),
					lte(payments.createdAt, periodEnd),
					eq(payments.status, 'succeeded')
				)
			);

		const revenueByCurrency = new Map<string, { totalAmount: number; paymentCount: number }>();

		result.forEach((payment) => {
			const currency = payment.currency;
			const amount = Number(payment.amount);

			if (!revenueByCurrency.has(currency)) {
				revenueByCurrency.set(currency, { totalAmount: 0, paymentCount: 0 });
			}

			const current = revenueByCurrency.get(currency);
			if (!current) {
				console.error('Currency not found in revenueByCurrency', currency);
				return;
			}

			current.totalAmount += amount;
			current.paymentCount += 1;
		});

		return Array.from(revenueByCurrency.entries()).map(([currency, data]) => ({
			currency,
			totalAmount: data.totalAmount,
			paymentCount: data.paymentCount
		}));
	}
};
