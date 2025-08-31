// 💳 Client-side Stripe Service
// Pure functions for pricing calculations and formatting
// Uses official Stripe types from the stripe package

import type { Stripe } from 'stripe';

// Use the same types as the server-side Stripe service
export type StripePrice = Stripe.Price;
export type StripeProduct = Stripe.Product;

export interface PricingTier {
	id: string;
	name: string;
	monthlyPrice: StripePrice | null;
	annualPrice: StripePrice | null;
	features: string[];
	description: string;
}

export interface BillingCycle {
	type: 'monthly' | 'annual';
	label: string;
	discount?: number; // Percentage discount for annual
}

export const BILLING_CYCLES: BillingCycle[] = [
	{ type: 'monthly', label: 'Monthly' },
	{ type: 'annual', label: 'Annual', discount: 20 }
];

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
	return cents / 100;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency.toUpperCase(),
		minimumFractionDigits: 2
	});
	return formatter.format(amount);
}

/**
 * Format price from cents
 */
export function formatPriceFromCents(cents: number, currency: string = 'USD'): string {
	return formatPrice(centsToDollars(cents), currency);
}

/**
 * Calculate annual discount percentage
 */
export function calculateAnnualDiscount(monthlyPrice: number, annualPrice: number): number {
	if (monthlyPrice <= 0 || annualPrice <= 0) return 0;

	const annualMonthlyEquivalent = annualPrice / 12;
	const discount = ((monthlyPrice - annualMonthlyEquivalent) / monthlyPrice) * 100;

	return Math.round(discount);
}

/**
 * Calculate monthly equivalent of annual price
 */
export function calculateMonthlyEquivalent(annualPrice: number): number {
	return annualPrice / 12;
}

/**
 * Get display price for a tier and billing cycle
 */
export function getDisplayPrice(
	tier: PricingTier,
	billingCycle: 'monthly' | 'annual'
): string | null {
	const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.annualPrice;

	if (!price || !price.unit_amount) return null;

	return formatPriceFromCents(price.unit_amount, price.currency);
}

/**
 * Get monthly equivalent price for annual billing
 */
export function getMonthlyEquivalentPrice(tier: PricingTier): string | null {
	if (!tier.annualPrice || !tier.annualPrice.unit_amount) return null;

	const monthlyAmount = calculateMonthlyEquivalent(centsToDollars(tier.annualPrice.unit_amount));
	return formatPrice(monthlyAmount, tier.annualPrice.currency);
}

/**
 * Calculate savings amount for annual billing
 */
export function calculateAnnualSavings(monthlyPrice: number, annualPrice: number): number {
	if (monthlyPrice <= 0 || annualPrice <= 0) return 0;

	const annualTotal = monthlyPrice * 12;
	return annualTotal - annualPrice;
}

/**
 * Format savings for display
 */
export function formatSavings(savings: number, currency: string = 'USD'): string {
	return formatPrice(savings, currency);
}

/**
 * Get price comparison data for display
 */
export function getPriceComparison(
	tier: PricingTier,
	billingCycle: 'monthly' | 'annual'
): {
	displayPrice: string;
	monthlyEquivalent?: string;
	savings?: string;
	discount?: number;
} {
	const result: {
		displayPrice: string;
		monthlyEquivalent?: string;
		savings?: string;
		discount?: number;
	} = {
		displayPrice: getDisplayPrice(tier, billingCycle) || 'N/A'
	};

	if (billingCycle === 'annual' && tier.monthlyPrice && tier.annualPrice) {
		const monthlyCents = tier.monthlyPrice.unit_amount || 0;
		const annualCents = tier.annualPrice.unit_amount || 0;

		result.monthlyEquivalent = getMonthlyEquivalentPrice(tier) || undefined;
		result.discount = calculateAnnualDiscount(
			centsToDollars(monthlyCents),
			centsToDollars(annualCents)
		);
		result.savings = formatSavings(
			calculateAnnualSavings(centsToDollars(monthlyCents), centsToDollars(annualCents)),
			tier.annualPrice.currency
		);
	}

	return result;
}

/**
 * Validate if a price ID is in the correct format
 */
export function isValidPriceId(priceId: string): boolean {
	// Stripe price IDs typically start with 'price_' and are alphanumeric
	return /^price_[a-zA-Z0-9_]+$/.test(priceId);
}

/**
 * Extract tier and billing cycle from price ID
 */
export function parsePriceId(priceId: string): {
	tier: string;
	billingCycle: 'monthly' | 'annual';
} | null {
	if (!isValidPriceId(priceId)) return null;

	const lowerPriceId = priceId.toLowerCase();

	// Determine tier
	let tier = 'unknown';
	if (lowerPriceId.includes('plus')) tier = 'plus';
	else if (lowerPriceId.includes('premium')) tier = 'premium';
	else if (lowerPriceId.includes('plus')) tier = 'plus';

	// Determine billing cycle
	let billingCycle: 'monthly' | 'annual' = 'monthly';
	if (lowerPriceId.includes('annual') || lowerPriceId.includes('yearly')) {
		billingCycle = 'annual';
	}

	return { tier, billingCycle };
}

/**
 * Get recommended billing cycle based on savings
 */
export function getRecommendedBillingCycle(
	monthlyPrice: number,
	annualPrice: number
): 'monthly' | 'annual' {
	if (monthlyPrice <= 0 || annualPrice <= 0) return 'monthly';

	const discount = calculateAnnualDiscount(monthlyPrice, annualPrice);
	return discount >= 15 ? 'annual' : 'monthly';
}

/**
 * Calculate total cost for a given period
 */
export function calculateTotalCost(price: StripePrice, months: number): number {
	if (!price.unit_amount) return 0;

	const monthlyAmount = centsToDollars(price.unit_amount);

	if (price.recurring?.interval === 'year') {
		const years = months / 12;
		return monthlyAmount * years;
	} else {
		return monthlyAmount * months;
	}
}

/**
 * Format billing interval for display
 */
export function formatBillingInterval(
	interval: 'month' | 'year',
	intervalCount: number = 1
): string {
	if (interval === 'year') {
		return intervalCount === 1 ? 'year' : `${intervalCount} years`;
	} else {
		return intervalCount === 1 ? 'month' : `${intervalCount} months`;
	}
}

/**
 * Get billing cycle label with discount badge
 */
export function getBillingCycleLabel(
	billingCycle: BillingCycle,
	showDiscount: boolean = true
): string {
	if (!showDiscount || !billingCycle.discount) {
		return billingCycle.label;
	}

	return `${billingCycle.label} (Save ${billingCycle.discount}%)`;
}

/**
 * Compare two pricing tiers
 */
export function compareTiers(
	tier1: PricingTier,
	tier2: PricingTier,
	billingCycle: 'monthly' | 'annual'
): {
	priceDifference: number;
	priceDifferenceFormatted: string;
	isMoreExpensive: boolean;
} {
	const price1 = billingCycle === 'monthly' ? tier1.monthlyPrice : tier1.annualPrice;
	const price2 = billingCycle === 'monthly' ? tier2.monthlyPrice : tier2.annualPrice;

	if (!price1 || !price2 || !price1.unit_amount || !price2.unit_amount) {
		return {
			priceDifference: 0,
			priceDifferenceFormatted: 'N/A',
			isMoreExpensive: false
		};
	}

	const difference = centsToDollars(price2.unit_amount) - centsToDollars(price1.unit_amount);

	return {
		priceDifference: Math.abs(difference),
		priceDifferenceFormatted: formatPrice(Math.abs(difference), price1.currency),
		isMoreExpensive: difference > 0
	};
}

/**
 * Get price metadata from Stripe price object
 */
export function getPriceMetadata(price: StripePrice): Record<string, string> {
	return price.metadata || {};
}

/**
 * Check if price has a specific metadata key
 */
export function hasPriceMetadata(price: StripePrice, key: string): boolean {
	return price.metadata?.[key] !== undefined;
}

/**
 * Get price metadata value
 */
export function getPriceMetadataValue(price: StripePrice, key: string): string | undefined {
	return price.metadata?.[key];
}

/**
 * Format price with currency symbol
 */
export function formatPriceWithCurrency(price: StripePrice): string {
	if (!price.unit_amount) return 'N/A';

	const amount = centsToDollars(price.unit_amount);
	const currency = price.currency.toUpperCase();

	// For common currencies, we can add symbols
	const currencySymbols: Record<string, string> = {
		USD: '$',
		EUR: '€',
		GBP: '£',
		JPY: '¥',
		CAD: 'C$',
		AUD: 'A$'
	};

	const symbol = currencySymbols[currency] || '';
	return `${symbol}${amount.toFixed(2)}`;
}
