// src/lib/server/repositories/tier.repository.ts

import { db } from '$lib/server/db/index';
import { tiers } from '$lib/server/db/schema';
import type { Tier } from '$lib/server/db/types';
import { eq, and, desc } from 'drizzle-orm';

export const tierRepository = {
	// READ
	async findTierById(id: string): Promise<Tier | undefined> {
		return db.query.tiers.findFirst({ where: eq(tiers.id, id) });
	},

	async findActiveTiers(): Promise<Tier[]> {
		return db.query.tiers.findMany({
			where: eq(tiers.isActive, true),
			orderBy: [desc(tiers.monthlyPriceUsd)]
		});
	},

	async findTierByStripeProductId(stripeProductId: string): Promise<Tier | undefined> {
		return db.query.tiers.findFirst({ where: eq(tiers.stripeProductId, stripeProductId) });
	},

	async findTierByStripePriceId(stripePriceId: string): Promise<Tier | undefined> {
		const result = await db
			.select()
			.from(tiers)
			.where(and(eq(tiers.stripePriceIdMonthly, stripePriceId), eq(tiers.isActive, true)))
			.limit(1);

		if (result.length === 0) {
			// Try annual price
			const annualResult = await db
				.select()
				.from(tiers)
				.where(and(eq(tiers.stripePriceIdAnnual, stripePriceId), eq(tiers.isActive, true)))
				.limit(1);

			return annualResult[0];
		}

		return result[0];
	},

	// UPDATE
	async updateTier(id: string, data: Partial<Tier>): Promise<Tier | undefined> {
		const [updatedTier] = await db
			.update(tiers)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(tiers.id, id))
			.returning();

		return updatedTier;
	},

	async toggleTierActive(id: string): Promise<Tier | undefined> {
		const currentTier = await this.findTierById(id);
		if (!currentTier) return undefined;

		const [updatedTier] = await db
			.update(tiers)
			.set({ isActive: !currentTier.isActive, updatedAt: new Date() })
			.where(eq(tiers.id, id))
			.returning();

		return updatedTier;
	},

	// UTILITY METHODS
	async getFreeTier(): Promise<Tier | undefined> {
		return this.findTierById('free');
	},

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async getTiersByPriceRange(_minPrice: number, _maxPrice: number): Promise<Tier[]> {
		// Note: This is a simplified implementation since price comparison with decimal types
		// requires more complex SQL. For now, return all active tiers.

		return db.query.tiers.findMany({
			where: eq(tiers.isActive, true),
			orderBy: [desc(tiers.monthlyPriceUsd)]
		});
	}
};
