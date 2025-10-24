export const load = async ({ parent }) => {
	const { seo, ...data } = await parent();

	return {
		...data,
		seo: {
			...seo,
			title: 'About Kaiwa - Your AI Language Partner for Confident Speaking',
			description:
				'Learn about Kaiwa\'s mission to build a world where everyone can speak confidently in any language. Discover how our AI language partner and coach helps you practice real conversations and connect with the world.',
			keywords:
				'about kaiwa, AI language partner, AI language coach, language learning mission, conversation practice, speaking confidence, language education technology',
			ogType: 'article'
		}
	};
};
