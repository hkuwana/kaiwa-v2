export const load = async ({ parent }) => {
	const { seo, ...data } = await parent();

	return {
		...data,
		seo: {
			...seo,
			title: 'Kaiwa Pricing - Plans for Your AI Language Partner & Coach',
			description:
				'Find the right plan for your language learning journey. Get started with our free AI language partner, or upgrade to unlock advanced features and unlimited practice with your AI language coach.',
			keywords:
				'kaiwa pricing, AI language partner pricing, AI language coach cost, language learning plans, conversation practice pricing, speaking practice plans, language app subscription',
			ogType: 'product'
		}
	};
};
