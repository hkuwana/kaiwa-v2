// 🏠 Home Page Server Logic
// Passes user data to the client for authentication state

export const load = async ({ locals }) => {
	return {
		user: locals.user,
		seo: {
			title: 'Kaiwa - Learn Languages Through AI Conversation',
			description:
				"Choose from 18+ languages and start practicing with our AI tutor. Immerse yourself in natural conversations and learn languages the way they're meant to be learned - through dialogue.",
			keywords:
				'language learning, AI tutor, conversation practice, speaking practice, language immersion, multiple languages, Japanese, Spanish, French, German, Italian, Portuguese, Korean, Chinese, Arabic, Hindi, Russian',
			ogType: 'website',
			canonical: 'https://kaiwa.app/',
			structuredData: {
				'@context': 'https://schema.org',
				'@type': 'WebPage',
				name: 'Language Learning Home',
				description: 'Choose from 18+ languages and start practicing with our AI tutor',
				url: 'https://kaiwa.app/',
				mainEntity: {
					'@type': 'ItemList',
					name: 'Available Languages',
					description: 'Languages available for conversation practice',
					numberOfItems: 18
				}
			}
		}
	};
};
