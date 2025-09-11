// 💳 Stripe Configuration
// Centralized configuration for all Stripe-related settings

import { dev } from '$app/environment';
import { env as publicEnv } from '$env/dynamic/public';

// Environment-aware price IDs (dev vs prod)
export const STRIPE_PRICE_IDS = {
	// Plus tier
	plus_monthly: {
		dev: 'price_1QkXgaJdpLyF8Hr4VNiD2JZp', // $15.00/month
		prod: 'price_1R14SjJdpLyF8Hr4qSWrDXHd' // Production monthly price
	},
	plus_annual: {
		dev: 'price_1R14ScJdpLyF8Hr4VNiD2JZp', // $144.00/year
		prod: 'price_1R14SjJdpLyF8Hr4Ii3wHzpz' // Production annual price
	},
	premium_monthly: {
		dev: 'price_premium_monthly_dev', // $25.00/month
		prod: 'price_premium_monthly_prod' // Production monthly price
	},
	premium_annual: {
		dev: 'price_premium_annual_dev', // $240.00/year
		prod: 'price_premium_annual_prod' // Production annual price
	}
} as const;

// Stripe price IDs for different tiers and billing cycles
export const STRIPE_PRICES = {
	// Plus tier
	plus_monthly: dev ? STRIPE_PRICE_IDS.plus_monthly.dev : STRIPE_PRICE_IDS.plus_monthly.prod,
	plus_annual: dev ? STRIPE_PRICE_IDS.plus_annual.dev : STRIPE_PRICE_IDS.plus_annual.prod,

	// Premium tier (placeholder - add actual price IDs when you create them)
	premium_monthly: 'price_premium_monthly_dev',
	premium_annual: 'price_premium_annual_dev'
} as const;

// Trial period configuration
export const STRIPE_TRIAL_DAYS = 8;

// Stripe API configuration
export const STRIPE_CONFIG = {
	apiVersion: '2025-08-27.basil' as const,
	typescript: true
} as const;

// Helper functions
export function getMonthlyPriceId(): string {
	return dev ? STRIPE_PRICE_IDS.plus_monthly.dev : STRIPE_PRICE_IDS.plus_monthly.prod;
}

export function getAnnualPriceId(): string {
	return dev ? STRIPE_PRICE_IDS.plus_annual.dev : STRIPE_PRICE_IDS.plus_annual.prod;
}

export function getPriceId(tier: 'plus' | 'premium', billingCycle: 'monthly' | 'annual'): string {
	const key = `${tier}_${billingCycle}` as keyof typeof STRIPE_PRICES;
	return STRIPE_PRICES[key];
}

export function isValidPriceId(priceId: string): boolean {
	const priceArray = Object.values(STRIPE_PRICES) as string[];
	const eb = publicEnv.PUBLIC_STRIPE_EARLY_BACKER_PRICE_ID;
	return priceArray.includes(priceId) || (!!eb && priceId === eb);
}

// Tier detection from price ID
export function getTierFromPriceId(priceId: string): 'plus' | 'premium' | 'unknown' {
	// Check for exact price ID matches first
	if (
		priceId === STRIPE_PRICE_IDS.plus_monthly.dev ||
		priceId === STRIPE_PRICE_IDS.plus_annual.dev
	) {
		return 'plus';
	}
	if (
		priceId === STRIPE_PRICE_IDS.plus_monthly.prod ||
		priceId === STRIPE_PRICE_IDS.plus_annual.prod
	) {
		return 'plus';
	}
	if (priceId.includes('premium')) return 'premium';
	if (priceId.includes('plus')) return 'plus';
	// Early‑backer maps to plus unless specified otherwise
	if (publicEnv.PUBLIC_STRIPE_EARLY_BACKER_PRICE_ID && priceId === publicEnv.PUBLIC_STRIPE_EARLY_BACKER_PRICE_ID) {
		return 'plus';
	}
	return 'unknown';
}

export function getEarlyBackerPriceId(): string | null {
	return publicEnv.PUBLIC_STRIPE_EARLY_BACKER_PRICE_ID || null;
}

// Billing cycle detection from price ID
export function getBillingFromPriceId(priceId: string): 'monthly' | 'annual' {
	if (priceId.includes('annual') || priceId.includes('yearly')) return 'annual';
	return 'monthly';
}

// Export types for use in other files
export type StripePriceId = (typeof STRIPE_PRICES)[keyof typeof STRIPE_PRICES];
export type StripeTier = 'plus' | 'premium' | 'unknown';
export type StripeBillingCycle = 'monthly' | 'annual';
