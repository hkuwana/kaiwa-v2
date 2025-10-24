export const load = async ({ parent }) => {
	const { seo, ...data } = await parent();

	return {
		...data,
		seo: {
			...seo,
			title: "Kaiwa's Philosophy - Real Conversations, Not Lessons",
			description:
				'Discover Kaiwa\'s \"anti-language-learning\" philosophy. We believe in preparing you for real-life conversations with an AI language partner, not just passing tests. Build the confidence to speak and connect.',
			keywords:
				'language learning philosophy, conversation-based learning, AI language partner, speaking confidence, real-world language, communicative approach, language learning manifesto',
			ogType: 'article'
		}
	};
};
