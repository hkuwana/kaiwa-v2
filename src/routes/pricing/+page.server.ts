import { defaultTierConfigs } from '$lib/data/tiers';

export const load = async () => {
	// Get tier configurations for server-side rendering
	const tiers = Object.values(defaultTierConfigs);

	return {
		tiers,
		meta: {
			title: 'Kaiwa Pricing — 5 Minutes a Day, Real Speaking Results',
			description:
				'Affordable plans for daily language practice. Start free and practice 5 minutes a day to build speaking confidence. Flexible pricing for your language learning journey.',
			keywords:
				'5 minute language practice, affordable language learning, daily practice pricing, conversation practice plans, speaking confidence subscription'
		}
	};
};
