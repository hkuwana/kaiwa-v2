// 💳 Enhanced Stripe Configuration
// Centralized configuration with STRIPE_DEV_MODE support for robust testing

import { dev } from '$app/environment';
import { env as publicEnv } from '$env/dynamic/public';
import { browser } from '$app/environment';

// Determine if we should use development Stripe configuration
// On client side, we can only use dev flag since private env vars aren't available
export const isStripeDev = dev;

// Environment-aware price IDs (dev vs prod)
// Client-side version uses hardcoded values since we can't access private env vars
export const STRIPE_PRICE_IDS = {
	// Plus tier - using known price IDs
	plus_monthly: {
		dev: 'price_1QkXgaJdpLyF8Hr4VNiD2JZp', // $15.00/month
		prod: 'price_1QkXgaJdpLyF8Hr4VNiD2JZp' // Same for now
	},
	plus_annual: {
		dev: 'price_1R14ScJdpLyF8Hr465lm9MA8', // $144.00/year
		prod: 'price_1R14ScJdpLyF8Hr465lm9MA8' // Same for now
	},
	premium_monthly: {
		dev: 'price_premium_monthly_dev_placeholder', // Will be replaced when you create the price
		prod: 'price_premium_monthly_prod_placeholder'
	},
	premium_annual: {
		dev: 'price_premium_annual_dev_placeholder', // Will be replaced when you create the price
		prod: 'price_premium_annual_prod_placeholder'
	}
} as const;

// Current environment-aware price IDs
export const STRIPE_PRICES = {
	// Plus tier
	plus_monthly: isStripeDev ? STRIPE_PRICE_IDS.plus_monthly.dev : STRIPE_PRICE_IDS.plus_monthly.prod,
	plus_annual: isStripeDev ? STRIPE_PRICE_IDS.plus_annual.dev : STRIPE_PRICE_IDS.plus_annual.prod,

	// Premium tier
	premium_monthly: isStripeDev ? STRIPE_PRICE_IDS.premium_monthly.dev : STRIPE_PRICE_IDS.premium_monthly.prod,
	premium_annual: isStripeDev ? STRIPE_PRICE_IDS.premium_annual.dev : STRIPE_PRICE_IDS.premium_annual.prod
} as const;

// Trial period configuration
export const STRIPE_TRIAL_DAYS = 8;

// Stripe API configuration
export const STRIPE_CONFIG = {
	apiVersion: '2025-08-27.basil' as const,
	typescript: true
} as const;

// Enhanced helper functions
export function getMonthlyPriceId(): string {
	return isStripeDev ? STRIPE_PRICE_IDS.plus_monthly.dev : STRIPE_PRICE_IDS.plus_monthly.prod;
}

export function getAnnualPriceId(): string {
	return isStripeDev ? STRIPE_PRICE_IDS.plus_annual.dev : STRIPE_PRICE_IDS.plus_annual.prod;
}

// Get all available price IDs for the current environment
export function getAllPriceIds(): string[] {
	return Object.values(STRIPE_PRICES);
}

// Get environment info for debugging (client-safe version)
export function getStripeEnvironmentInfo() {
	return {
		isStripeDev,
		devEnvironment: dev,
		stripeDevMode: isStripeDev ? 'true' : 'false', // Client-safe fallback
		currentPrices: STRIPE_PRICES,
		allPriceIds: getAllPriceIds(),
		clientSide: browser
	};
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
