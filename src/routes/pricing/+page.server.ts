import { defaultTierConfigs } from '$lib/data/tiers';
import { createPricingProductJsonLd } from '$lib/seo/jsonld';

export const load = async ({ url }) => {
	// Get tier configurations for server-side rendering
	const tiers = Object.values(defaultTierConfigs);
	const baseUrl = url.origin;

	// Get billing cycle from URL or default to monthly
	const billingCycle = (url.searchParams.get('billing') as 'monthly' | 'annual') || 'monthly';

	// Create JSON-LD for each pricing tier
	const pricingJsonLd = Object.values(defaultTierConfigs).map((tier) =>
		createPricingProductJsonLd(
			{
				name: tier.name,
				description: tier.description || `Kaiwa ${tier.name} tier`,
				monthlyPriceUsd: tier.monthlyPriceUsd,
				annualPriceUsd: tier.annualPriceUsd,
				features: [] // We can expand this later if needed
			},
			baseUrl,
			billingCycle
		)
	);

	return {
		tiers,
		pricingJsonLd,
		meta: {
			title: 'Kaiwa Pricing — 5 Minutes a Day, Real Speaking Results',
			description:
				'Affordable plans for daily language practice. Start free and practice 5 minutes a day to build speaking confidence. Flexible pricing for your language learning journey.',
			keywords:
				'5 minute language practice, affordable language learning, daily practice pricing, conversation practice plans, speaking confidence subscription'
		}
	};
};
