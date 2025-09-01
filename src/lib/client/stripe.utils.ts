// 🔧 Stripe Utility Functions
// Fetch real pricing data from Stripe API instead of creating mock objects

import type { PricingTier } from './stripe.service';
import type { Tier } from '$lib/server/db/types';

/**
 * Convert tier config to basic pricing format (without Stripe objects)
 * This avoids type issues while still providing the data needed for display
 */
export function convertTierToBasicFormat(tier: Tier): {
	id: string;
	name: string;
	monthlyPrice: { amount: number; currency: string } | null;
	annualPrice: { amount: number; currency: string } | null;
	features: string[];
	description: string;
} {
	// Convert price strings to simple objects
	const monthlyPrice =
		tier.monthlyPriceUsd && tier.monthlyPriceUsd !== '0'
			? { amount: parseFloat(tier.monthlyPriceUsd), currency: 'USD' }
			: null;

	const annualPrice =
		tier.annualPriceUsd && tier.annualPriceUsd !== '0'
			? { amount: parseFloat(tier.annualPriceUsd), currency: 'USD' }
			: null;

	// Extract features from tier config
	const features = [
		`${tier.monthlySeconds ? Math.floor(tier.monthlySeconds / 60) : 'Unlimited'} minutes/month`,
		`${tier.maxSessionLengthSeconds ? Math.floor(tier.maxSessionLengthSeconds / 60) : 'Unlimited'} min sessions`,
		tier.hasRealtimeAccess ? 'Real-time conversations' : null,
		tier.hasAdvancedVoices ? 'Advanced AI voices' : null,
		tier.hasAnalytics ? 'Progress analytics' : null,
		tier.hasCustomPhrases ? 'Custom phrases' : null,
		tier.hasConversationMemory ? 'Conversation memory' : null,
		tier.hasAnkiExport ? 'Anki export' : null
	].filter(Boolean) as string[];

	return {
		id: tier.id,
		name: tier.name,
		monthlyPrice,
		annualPrice,
		features,
		description: tier.description || ''
	};
}

/**
 * Fetch real Stripe price data for a tier (optional enhancement)
 */
export async function fetchTierPricing(
	tier: Tier,
	priceIds: {
		monthly?: string;
		annual?: string;
	}
): Promise<PricingTier> {
	// Fetch real price data from your Stripe API endpoints
	const [monthlyPrice, annualPrice] = await Promise.all([
		priceIds.monthly ? fetchPriceData(priceIds.monthly) : null,
		priceIds.annual ? fetchPriceData(priceIds.annual) : null
	]);

	// Extract features from tier config
	const features = [
		`${tier.monthlySeconds ? Math.floor(tier.monthlySeconds / 60) : 'Unlimited'} minutes/month`,
		`${tier.maxSessionLengthSeconds ? Math.floor(tier.maxSessionLengthSeconds / 60) : 'Unlimited'} min sessions`,
		tier.hasRealtimeAccess ? 'Real-time conversations' : null,
		tier.hasAdvancedVoices ? 'Advanced AI voices' : null,
		tier.hasAnalytics ? 'Progress analytics' : null,
		tier.hasCustomPhrases ? 'Custom phrases' : null,
		tier.hasConversationMemory ? 'Conversation memory' : null,
		tier.hasAnkiExport ? 'Anki export' : null
	].filter(Boolean) as string[];

	return {
		id: tier.id,
		name: tier.name,
		monthlyPrice,
		annualPrice,
		features,
		description: tier.description || ''
	};
}

/**
 * Fetch price data from your Stripe API endpoint
 */
async function fetchPriceData(priceId: string) {
	try {
		const response = await fetch(`/api/stripe/price/${priceId}`);
		if (!response.ok) {
			console.warn(`Failed to fetch price ${priceId}:`, response.statusText);
			return null;
		}
		return await response.json();
	} catch (error) {
		console.warn(`Error fetching price ${priceId}:`, error);
		return null;
	}
}

/**
 * Get price IDs from environment or generate defaults
 */
export function getPriceIdsForTier(tierId: string): {
	monthly?: string;
	annual?: string;
} {
	// These would ideally come from environment variables or API
	// For now, using the pattern from your existing setup
	const priceMap: Record<string, { monthly?: string; annual?: string }> = {
		plus: {
			monthly: 'price_plus_monthly_dev', // Replace with actual Stripe price ID
			annual: 'price_plus_annual_dev' // Replace with actual Stripe price ID
		},
		premium: {
			monthly: 'price_premium_monthly_dev', // Replace with actual Stripe price ID
			annual: 'price_premium_annual_dev' // Replace with actual Stripe price ID
		}
	};

	return priceMap[tierId] || {};
}

/**
 * Validate tier configuration for Stripe integration
 */
export function validateTierForStripe(tier: Tier): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!tier.monthlyPriceUsd && !tier.annualPriceUsd) {
		errors.push('Tier must have at least one price (monthly or annual)');
	}

	if (tier.monthlyPriceUsd && parseFloat(tier.monthlyPriceUsd) < 0) {
		errors.push('Monthly price cannot be negative');
	}

	if (tier.annualPriceUsd && parseFloat(tier.annualPriceUsd) < 0) {
		errors.push('Annual price cannot be negative');
	}

	if (tier.monthlyPriceUsd && tier.annualPriceUsd) {
		const monthly = parseFloat(tier.monthlyPriceUsd);
		const annual = parseFloat(tier.annualPriceUsd);

		if (annual > monthly * 12) {
			errors.push('Annual price should be less than or equal to 12x monthly price');
		}
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

/**
 * Get tier comparison data for display
 */
export function getTierComparison(
	tier1: {
		monthlyPrice?: { amount: number } | null;
		annualPrice?: { amount: number } | null;
		name: string;
	},
	tier2: {
		monthlyPrice?: { amount: number } | null;
		annualPrice?: { amount: number } | null;
		name: string;
	},
	billingCycle: 'monthly' | 'annual'
): {
	priceDifference: string;
	isMoreExpensive: boolean;
	recommendation: string;
} {
	const price1 = billingCycle === 'monthly' ? tier1.monthlyPrice : tier1.annualPrice;
	const price2 = billingCycle === 'monthly' ? tier2.monthlyPrice : tier2.annualPrice;

	if (!price1 || !price2 || !price1.amount || !price2.amount) {
		return {
			priceDifference: 'N/A',
			isMoreExpensive: false,
			recommendation: 'Price information unavailable'
		};
	}

	const difference = price2.amount - price1.amount;
	const isMoreExpensive = difference > 0;

	let recommendation = '';
	if (isMoreExpensive) {
		recommendation = `${tier2.name} costs ${Math.abs(difference).toFixed(2)} more per ${billingCycle === 'monthly' ? 'month' : 'year'}`;
	} else if (difference < 0) {
		recommendation = `${tier2.name} saves ${Math.abs(difference).toFixed(2)} per ${billingCycle === 'monthly' ? 'month' : 'year'}`;
	} else {
		recommendation = 'Both tiers cost the same';
	}

	return {
		priceDifference: `$${Math.abs(difference).toFixed(2)}`,
		isMoreExpensive,
		recommendation
	};
}
