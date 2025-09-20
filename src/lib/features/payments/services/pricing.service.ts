// 💰 Client-side Pricing Service
// Fetches pricing data from the API

import type { Tier } from '$lib/server/db/types';

export interface PricingResponse {
	success: boolean;
	tiers: Tier[];
}

export class PricingService {
	private static cache: Tier[] | null = null;
	private static cacheExpiry: number = 0;
	private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

	/**
	 * Fetch pricing data from API
	 */
	static async fetchPricing(): Promise<Tier[]> {
		// Check cache first
		if (this.cache && Date.now() < this.cacheExpiry) {
			return this.cache;
		}

		try {
			const response = await fetch('/api/pricing');

			if (!response.ok) {
				throw new Error(`Failed to fetch pricing: ${response.status}`);
			}

			const data: PricingResponse = await response.json();

			if (!data.success) {
				throw new Error('Invalid pricing response');
			}

			// Cache the result
			this.cache = data.tiers;
			this.cacheExpiry = Date.now() + this.CACHE_DURATION;

			return data.tiers;
		} catch (error) {
			console.error('Error fetching pricing data:', error);
			throw error;
		}
	}

	/**
	 * Get a specific tier by ID
	 */
	static async getTier(tierId: string): Promise<Tier | null> {
		const tiers = await this.fetchPricing();
		return tiers.find((tier) => tier.id === tierId) || null;
	}

	/**
	 * Get all tiers
	 */
	static async getAllTiers(): Promise<Tier[]> {
		return await this.fetchPricing();
	}

	/**
	 * Clear cache (useful for testing or when you know data has changed)
	 */
	static clearCache(): void {
		this.cache = null;
		this.cacheExpiry = 0;
	}

	/**
	 * Get pricing comparison data
	 */
	static async getPricingComparison(): Promise<{
		free: Tier | null;
		plus: Tier | null;
		premium: Tier | null;
	}> {
		const tiers = await this.fetchPricing();

		return {
			free: tiers.find((t) => t.id === 'free') || null,
			plus: tiers.find((t) => t.id === 'plus') || null,
			premium: tiers.find((t) => t.id === 'premium') || null
		};
	}
}

// Export convenience functions
export const fetchPricing = PricingService.fetchPricing;
export const getTier = PricingService.getTier;
export const getAllTiers = PricingService.getAllTiers;
export const getPricingComparison = PricingService.getPricingComparison;

