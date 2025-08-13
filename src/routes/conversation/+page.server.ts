// 🗣️ Conversation Page Server Logic
// Handles conversation-specific data and settings

export const load = async ({ locals, url }) => {
	const language = url.searchParams.get('lang') || 'en';
	const mode = (url.searchParams.get('mode') as 'traditional' | 'realtime') || 'traditional';
	const voice = url.searchParams.get('voice') || 'alloy';

	// Get language details for SEO
	const languageNames = {
		en: 'English',
		es: 'Spanish',
		fr: 'French',
		de: 'German',
		it: 'Italian',
		pt: 'Portuguese',
		ja: 'Japanese',
		ko: 'Korean',
		zh: 'Chinese',
		ar: 'Arabic',
		hi: 'Hindi',
		ru: 'Russian',
		vi: 'Vietnamese',
		nl: 'Dutch',
		fil: 'Filipino',
		id: 'Indonesian',
		tr: 'Turkish'
	};

	const currentLanguage = languageNames[language as keyof typeof languageNames] || 'English';
	const modeText = mode === 'realtime' ? 'Real-time' : 'Traditional';

	return {
		user: locals.user,
		language,
		mode,
		voice,
		seo: {
			title: `Practice ${currentLanguage} with AI - ${modeText} Mode | Kaiwa`,
			description: `Practice speaking ${currentLanguage} naturally with our AI tutor. ${mode === 'realtime' ? 'Experience live conversation streaming' : 'Record your speech and get AI responses'}. Start your language learning journey today.`,
			keywords: `${currentLanguage.toLowerCase()}, language practice, AI conversation, speaking practice, ${mode} mode, language learning, conversation tutor`,
			ogType: 'website',
			canonical: `https://kaiwa.app/conversation?lang=${language}&mode=${mode}&voice=${voice}`,
			structuredData: {
				'@context': 'https://schema.org',
				'@type': 'WebPage',
				name: `${currentLanguage} Conversation Practice`,
				description: `Practice speaking ${currentLanguage} with AI tutor`,
				url: `https://kaiwa.app/conversation?lang=${language}&mode=${mode}&voice=${voice}`,
				mainEntity: {
					'@type': 'LearningResource',
					name: `${currentLanguage} Language Practice`,
					description: `AI-powered conversation practice for ${currentLanguage}`,
					learningResourceType: 'Conversation Practice',
					educationalLevel: 'Beginner to Advanced'
				}
			}
		}
	};
};
