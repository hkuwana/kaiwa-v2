import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { seo, ...data } = await parent();
	
	return {
		...data,
		seo: {
			...seo,
			title: 'Kaiwa Pricing - Choose Your Language Learning Plan | Free Trial Available',
			description: 'Choose the perfect Kaiwa plan for your language learning goals. Start free, then unlock more practice time with Plus or Premium plans. AI conversation practice for Japanese, Spanish, French and more.',
			keywords: 'kaiwa pricing, language learning plans, AI conversation cost, japanese learning subscription, spanish practice pricing, french tutor cost, language app pricing, conversation practice plans',
			ogType: 'product'
		}
	};
};