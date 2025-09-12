// 💳 Server-side Stripe Configuration
// This file can access private environment variables and should only be used server-side

import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';

// Determine if we should use development Stripe configuration
// Priority: STRIPE_DEV_MODE > dev environment
function shouldUseDev(): boolean {
	// If STRIPE_DEV_MODE is explicitly set, use that
	if (privateEnv.STRIPE_DEV_MODE !== undefined) {
		return privateEnv.STRIPE_DEV_MODE === 'true';
	}
	// Fallback to dev environment check
	return dev;
}

export const isStripeDevServer = shouldUseDev();

// Server-side price IDs with access to private environment variables
export const SERVER_STRIPE_PRICE_IDS = {
	// Plus tier - using environment variables
	plus_monthly: {
		dev: privateEnv.STRIPE_PLUS_MONTHLY_DEV_PRICE_ID || privateEnv.STRIPE_PLUS_MONTHLY_PRICE_ID || 'price_1QkXgaJdpLyF8Hr4VNiD2JZp',
		prod: privateEnv.STRIPE_PLUS_MONTHLY_PRICE_ID || 'price_1QkXgaJdpLyF8Hr4VNiD2JZp'
	},
	plus_annual: {
		dev: privateEnv.STRIPE_PLUS_ANNUAL_DEV_PRICE_ID || privateEnv.STRIPE_PLUS_ANNUAL_PRICE_ID || 'price_1R14ScJdpLyF8Hr465lm9MA8',
		prod: privateEnv.STRIPE_PLUS_ANNUAL_PRICE_ID || 'price_1R14ScJdpLyF8Hr465lm9MA8'
	},
	premium_monthly: {
		dev: privateEnv.STRIPE_PREMIUM_MONTHLY_DEV_PRICE_ID || 'price_premium_monthly_dev_placeholder',
		prod: privateEnv.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly_prod_placeholder'
	},
	premium_annual: {
		dev: privateEnv.STRIPE_PREMIUM_ANNUAL_DEV_PRICE_ID || 'price_premium_annual_dev_placeholder',
		prod: privateEnv.STRIPE_PREMIUM_ANNUAL_PRICE_ID || 'price_premium_annual_prod_placeholder'
	}
} as const;

// Current server-side price IDs
export const SERVER_STRIPE_PRICES = {
	plus_monthly: isStripeDevServer ? SERVER_STRIPE_PRICE_IDS.plus_monthly.dev : SERVER_STRIPE_PRICE_IDS.plus_monthly.prod,
	plus_annual: isStripeDevServer ? SERVER_STRIPE_PRICE_IDS.plus_annual.dev : SERVER_STRIPE_PRICE_IDS.plus_annual.prod,
	premium_monthly: isStripeDevServer ? SERVER_STRIPE_PRICE_IDS.premium_monthly.dev : SERVER_STRIPE_PRICE_IDS.premium_monthly.prod,
	premium_annual: isStripeDevServer ? SERVER_STRIPE_PRICE_IDS.premium_annual.dev : SERVER_STRIPE_PRICE_IDS.premium_annual.prod
} as const;

// Server-side helper functions
export function getServerMonthlyPriceId(): string {
	return isStripeDevServer ? SERVER_STRIPE_PRICE_IDS.plus_monthly.dev : SERVER_STRIPE_PRICE_IDS.plus_monthly.prod;
}

export function getServerAnnualPriceId(): string {
	return isStripeDevServer ? SERVER_STRIPE_PRICE_IDS.plus_annual.dev : SERVER_STRIPE_PRICE_IDS.plus_annual.prod;
}

export function getServerPriceId(tier: 'plus' | 'premium', billingCycle: 'monthly' | 'annual'): string {
	const key = `${tier}_${billingCycle}` as keyof typeof SERVER_STRIPE_PRICES;
	return SERVER_STRIPE_PRICES[key];
}

// Get all server-side price IDs
export function getAllServerPriceIds(): string[] {
	return Object.values(SERVER_STRIPE_PRICES).filter(id => id && !id.includes('placeholder'));
}

// Server-side environment info
export function getServerStripeEnvironmentInfo() {
	return {
		isStripeDev: isStripeDevServer,
		devEnvironment: dev,
		stripeDevMode: privateEnv.STRIPE_DEV_MODE,
		currentPrices: SERVER_STRIPE_PRICES,
		allPriceIds: getAllServerPriceIds(),
		serverSide: true
	};
}