import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const parentData = await parent();

	return {
		...parentData,
		seo: {
			...parentData.seo,
			title: 'Kaiwa - Master Languages Through AI Conversation Practice',
			description:
				'Learn languages naturally with AI-powered conversations. Practice speaking Japanese, Spanish, French, and more through realistic scenarios. Start your free conversation today.',
			keywords:
				'language learning, AI conversation, Japanese learning, Spanish practice, French conversation, learn languages online, speaking practice, language tutor, conversation practice app',
			ogType: 'website'
		}
	};
};
