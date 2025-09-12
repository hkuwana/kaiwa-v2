import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { seo, ...data } = await parent();

	return {
		...data,
		seo: {
			...seo,
			title: 'About Kaiwa - The Anti-Language-Learning App Philosophy',
			description:
				'Discover the story behind Kaiwa and our mission to help language learners build real connections through conversation. Learn why we focus on heart-to-heart communication over test scores.',
			keywords:
				'about kaiwa, language learning philosophy, conversation-focused learning, AI language tutor story, natural language acquisition, language learning mission',
			ogType: 'article'
		}
	};
};
