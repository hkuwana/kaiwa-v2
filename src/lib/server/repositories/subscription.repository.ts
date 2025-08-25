// src/lib/server/repositories/subscription.repository.ts

import { db } from '$lib/server/db/index';
import { subscriptions } from '$lib/server/db/schema';
import type { NewSubscription, Subscription } from '$lib/server/db/types';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

export const subscriptionRepository = {
	// CREATE
	async createSubscription(newSubscription: NewSubscription): Promise<Subscription> {
		const [createdSubscription] = await db
			.insert(subscriptions)
			.values(newSubscription)
			.returning();

		return createdSubscription;
	},

	// READ
	async findSubscriptionById(id: string): Promise<Subscription | undefined> {
		return db.query.subscriptions.findFirst({ where: eq(subscriptions.id, id) });
	},

	async findSubscriptionByStripeId(
		stripeSubscriptionId: string
	): Promise<Subscription | undefined> {
		return db.query.subscriptions.findFirst({
			where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)
		});
	},

	async findActiveSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
		return db.query.subscriptions.findFirst({
			where: and(eq(subscriptions.userId, userId), eq(subscriptions.isActive, true))
		});
	},

	async findSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
		return db.query.subscriptions.findMany({
			where: eq(subscriptions.userId, userId),
			orderBy: [desc(subscriptions.createdAt)]
		});
	},

	async findSubscriptionsByStatus(status: string): Promise<Subscription[]> {
		return db.query.subscriptions.findMany({
			where: eq(subscriptions.status, status),
			orderBy: [desc(subscriptions.createdAt)]
		});
	},

	async findExpiringSubscriptions(daysUntilExpiry: number = 7): Promise<Subscription[]> {
		const expiryDate = new Date();
		expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

		return db.query.subscriptions.findMany({
			where: and(
				eq(subscriptions.isActive, true),
				gte(subscriptions.currentPeriodEnd, new Date()),
				lte(subscriptions.currentPeriodEnd, expiryDate)
			),
			orderBy: [subscriptions.currentPeriodEnd]
		});
	},

	async findSubscriptionsByTier(tierId: string): Promise<Subscription[]> {
		return db.query.subscriptions.findMany({
			where: and(eq(subscriptions.tierId, tierId), eq(subscriptions.isActive, true)),
			orderBy: [desc(subscriptions.createdAt)]
		});
	},

	// UPDATE
	async updateSubscription(
		id: string,
		data: Partial<NewSubscription>
	): Promise<Subscription | undefined> {
		const [updatedSubscription] = await db
			.update(subscriptions)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(subscriptions.id, id))
			.returning();

		return updatedSubscription;
	},

	async updateSubscriptionStatus(
		id: string,
		status: string,
		effectiveTier?: string
	): Promise<Subscription | undefined> {
		const updateData: Partial<NewSubscription> = {
			status,
			updatedAt: new Date()
		};

		if (effectiveTier) {
			updateData.effectiveTier = effectiveTier;
		}

		// Update isActive based on status
		updateData.isActive = ['active', 'trialing'].includes(status);

		const [updatedSubscription] = await db
			.update(subscriptions)
			.set(updateData)
			.where(eq(subscriptions.id, id))
			.returning();

		return updatedSubscription;
	},

	async cancelSubscription(
		id: string,
		cancelAtPeriodEnd: boolean = true
	): Promise<Subscription | undefined> {
		const [updatedSubscription] = await db
			.update(subscriptions)
			.set({
				cancelAtPeriodEnd,
				updatedAt: new Date()
			})
			.where(eq(subscriptions.id, id))
			.returning();

		return updatedSubscription;
	},

	// DELETE
	async deleteSubscription(id: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(subscriptions)
			.where(eq(subscriptions.id, id))
			.returning({ id: subscriptions.id });

		return { success: result.length > 0 };
	},

	// UTILITY METHODS
	async getActiveSubscriptionCount(): Promise<number> {
		const result = await db
			.select({ count: subscriptions.id })
			.from(subscriptions)
			.where(eq(subscriptions.isActive, true));

		return result.length;
	},

	async getSubscriptionRevenue(
		_periodStart: Date, // eslint-disable-line @typescript-eslint/no-unused-vars
		_periodEnd: Date // eslint-disable-line @typescript-eslint/no-unused-vars
	): Promise<
		{
			tierId: string;
			tierName: string;
			subscriptionCount: number;
			monthlyRevenue: number;
		}[]
	> {
		// This would need to be implemented based on your pricing structure
		// For now, returning basic structure
		return [];
	}
};
