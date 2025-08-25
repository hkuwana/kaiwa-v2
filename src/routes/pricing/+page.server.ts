import { defaultTierConfigs } from '$lib/data/tiers';

export const load = async () => {
	// Get tier configurations for server-side rendering
	const tiers = Object.values(defaultTierConfigs);

	return {
		tiers,
		meta: {
			title: 'Kaiwa | Pricing Plans',
			description:
				'Choose a Kaiwa plan that fits your language learning goals. Basic, Plus, and Premium options available.',
			keywords:
				'language learning, conversation practice, pricing, subscription, basic, plus, premium'
		}
	};
};
