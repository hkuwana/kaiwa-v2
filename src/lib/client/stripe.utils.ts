// 🔧 Stripe Utility Functions
// Convert existing tier data to Stripe service format

import type { StripePrice, PricingTier } from './stripe.service';
import type { TierConfig } from '../data/tiers';

/**
 * Convert existing tier config to Stripe service format
 */
export function convertTierToStripeFormat(
	tierConfig: TierConfig,
	priceIds: {
		monthly?: string;
		annual?: string;
	}
): PricingTier {
	// Convert price strings to StripePrice objects
	const monthlyPrice: StripePrice | null =
		tierConfig.monthlyPriceUsd && tierConfig.monthlyPriceUsd !== '0'
			? ({
					id: priceIds.monthly || `price_${tierConfig.id}_monthly`,
					object: 'price',
					active: true,
					currency: 'usd',
					livemode: false,
					lookup_key: null,
					metadata: {},
					nickname: null,
					product: `prod_${tierConfig.id}`,
					recurring: {
						interval: 'month',
						interval_count: 1,
						usage_type: 'licensed'
					},
					tax_behavior: null,
					type: 'recurring',
					unit_amount: Math.round(parseFloat(tierConfig.monthlyPriceUsd) * 100), // Convert to cents
					unit_amount_decimal: (parseFloat(tierConfig.monthlyPriceUsd) * 100).toString(),
					created: Math.floor(Date.now() / 1000),
					unit_amount_min: null,
					unit_amount_max: null,
					transform_quantity: null,
					billing_scheme: 'per_unit'
				} as StripePrice)
			: null;

	const annualPrice: StripePrice | null =
		tierConfig.annualPriceUsd && tierConfig.annualPriceUsd !== '0'
			? ({
					id: priceIds.annual || `price_${tierConfig.id}_annual`,
					object: 'price',
					active: true,
					currency: 'usd',
					livemode: false,
					lookup_key: null,
					metadata: {},
					nickname: null,
					product: `prod_${tierConfig.id}`,
					recurring: {
						interval: 'year',
						interval_count: 1,
						usage_type: 'licensed'
					},
					tax_behavior: null,
					type: 'recurring',
					unit_amount: Math.round(parseFloat(tierConfig.annualPriceUsd) * 100), // Convert to cents
					unit_amount_decimal: (parseFloat(tierConfig.annualPriceUsd) * 100).toString(),
					created: Math.floor(Date.now() / 1000),
					unit_amount_min: null,
					unit_amount_max: null,
					transform_quantity: null,
					billing_scheme: 'per_unit'
				} as StripePrice)
			: null;

	// Extract features from tier config
	const features = [
		`${tierConfig.monthlySeconds ? Math.floor(tierConfig.monthlySeconds / 60) : 'Unlimited'} minutes/month`,
		`${tierConfig.maxSessionLengthSeconds ? Math.floor(tierConfig.maxSessionLengthSeconds / 60) : 'Unlimited'} min sessions`,
		tierConfig.hasRealtimeAccess ? 'Real-time conversations' : null,
		tierConfig.hasAdvancedVoices ? 'Advanced AI voices' : null,
		tierConfig.hasAnalytics ? 'Progress analytics' : null,
		tierConfig.hasCustomPhrases ? 'Custom phrases' : null,
		tierConfig.hasConversationMemory ? 'Conversation memory' : null,
		tierConfig.hasAnkiExport ? 'Anki export' : null
	].filter(Boolean) as string[];

	return {
		id: tierConfig.id,
		name: tierConfig.name,
		monthlyPrice,
		annualPrice,
		features,
		description: tierConfig.description || ''
	};
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
 * Create mock Stripe prices for development/testing
 */
export function createMockStripePrices(
	monthlyPrice: string,
	annualPrice: string,
	tierId: string
): { monthly: StripePrice; annual: StripePrice } {
	const basePrice: Partial<StripePrice> = {
		object: 'price',
		active: true,
		currency: 'usd',
		livemode: false,
		lookup_key: null,
		metadata: {},
		nickname: null,
		product: `prod_${tierId}`,
		tax_behavior: null,
		type: 'recurring',
		created: Math.floor(Date.now() / 1000),
		unit_amount_min: null,
		unit_amount_max: null,
		transform_quantity: null,
		billing_scheme: 'per_unit'
	};

	return {
		monthly: {
			...basePrice,
			id: `price_${tierId}_monthly_dev`,
			recurring: {
				interval: 'month',
				interval_count: 1,
				usage_type: 'licensed'
			},
			unit_amount: Math.round(parseFloat(monthlyPrice) * 100),
			unit_amount_decimal: (parseFloat(monthlyPrice) * 100).toString()
		} as StripePrice,
		annual: {
			...basePrice,
			id: `price_${tierId}_annual_dev`,
			recurring: {
				interval: 'year',
				interval_count: 1,
				usage_type: 'licensed'
			},
			unit_amount: Math.round(parseFloat(annualPrice) * 100),
			unit_amount_decimal: (parseFloat(annualPrice) * 100).toString()
		} as StripePrice
	};
}

/**
 * Validate tier configuration for Stripe integration
 */
export function validateTierForStripe(tierConfig: TierConfig): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!tierConfig.monthlyPriceUsd && !tierConfig.annualPriceUsd) {
		errors.push('Tier must have at least one price (monthly or annual)');
	}

	if (tierConfig.monthlyPriceUsd && parseFloat(tierConfig.monthlyPriceUsd) < 0) {
		errors.push('Monthly price cannot be negative');
	}

	if (tierConfig.annualPriceUsd && parseFloat(tierConfig.annualPriceUsd) < 0) {
		errors.push('Annual price cannot be negative');
	}

	if (tierConfig.monthlyPriceUsd && tierConfig.annualPriceUsd) {
		const monthly = parseFloat(tierConfig.monthlyPriceUsd);
		const annual = parseFloat(tierConfig.annualPriceUsd);

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
	tier1: PricingTier,
	tier2: PricingTier,
	billingCycle: 'monthly' | 'annual'
): {
	priceDifference: string;
	isMoreExpensive: boolean;
	recommendation: string;
} {
	const price1 = billingCycle === 'monthly' ? tier1.monthlyPrice : tier1.annualPrice;
	const price2 = billingCycle === 'monthly' ? tier2.monthlyPrice : tier2.annualPrice;

	if (!price1 || !price2 || !price1.unit_amount || !price2.unit_amount) {
		return {
			priceDifference: 'N/A',
			isMoreExpensive: false,
			recommendation: 'Price information unavailable'
		};
	}

	const difference = (price2.unit_amount - price1.unit_amount) / 100; // Convert from cents
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
