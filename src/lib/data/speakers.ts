// 🗣️ Speaker Data
// All speakers from kaiwa-old with voice provider information

export interface Speaker {
	id: string;
	languageId: string;
	region: string;
	dialectName: string;
	bcp47Code: string;
	speakerEmoji: string;
	gender: 'male' | 'female';
	voiceName: string;
	voiceProviderId: string;
	isActive: boolean;
}

export const speakers: Speaker[] = [
	// --- Japanese Speakers ---
	{
		id: 'ja-jp-male',
		languageId: 'ja',
		region: 'Japan',
		dialectName: 'Japanese',
		bcp47Code: 'ja-JP',
		speakerEmoji: '🇯🇵',
		gender: 'male',
		voiceName: 'Hiro',
		voiceProviderId: 'openai-hiro',
		isActive: true
	},
	{
		id: 'ja-jp-female',
		languageId: 'ja',
		region: 'Japan',
		dialectName: 'Japanese',
		bcp47Code: 'ja-JP',
		speakerEmoji: '🇯🇵',
		gender: 'female',
		voiceName: 'Yuki',
		voiceProviderId: 'openai-yuki',
		isActive: true
	},

	// --- English Speakers ---
	{
		id: 'en-us-male',
		languageId: 'en',
		region: 'United States',
		dialectName: 'American English',
		bcp47Code: 'en-US',
		speakerEmoji: '🇺🇸',
		gender: 'male',
		voiceName: 'Matthew',
		voiceProviderId: 'openai-matthew',
		isActive: true
	},
	{
		id: 'en-us-female',
		languageId: 'en',
		region: 'United States',
		dialectName: 'American English',
		bcp47Code: 'en-US',
		speakerEmoji: '🇺🇸',
		gender: 'female',
		voiceName: 'Emily',
		voiceProviderId: 'openai-emily',
		isActive: true
	},
	{
		id: 'en-gb-male',
		languageId: 'en',
		region: 'Great Britain',
		dialectName: 'British English',
		bcp47Code: 'en-GB',
		speakerEmoji: '🇬🇧',
		gender: 'male',
		voiceName: 'James',
		voiceProviderId: 'openai-james',
		isActive: true
	},
	{
		id: 'en-gb-female',
		languageId: 'en',
		region: 'Great Britain',
		dialectName: 'British English',
		bcp47Code: 'en-GB',
		speakerEmoji: '🇬🇧',
		gender: 'female',
		voiceName: 'Charlotte',
		voiceProviderId: 'openai-charlotte',
		isActive: true
	},

	// --- Spanish Speakers ---
	{
		id: 'es-es-male',
		languageId: 'es',
		region: 'Spain',
		dialectName: 'Castilian Spanish',
		bcp47Code: 'es-ES',
		speakerEmoji: '🇪🇸',
		gender: 'male',
		voiceName: 'Javier',
		voiceProviderId: 'openai-javier',
		isActive: true
	},
	{
		id: 'es-es-female',
		languageId: 'es',
		region: 'Spain',
		dialectName: 'Castilian Spanish',
		bcp47Code: 'es-ES',
		speakerEmoji: '🇪🇸',
		gender: 'female',
		voiceName: 'Sofia',
		voiceProviderId: 'openai-sofia',
		isActive: true
	},
	{
		id: 'es-mx-male',
		languageId: 'es',
		region: 'Mexico',
		dialectName: 'Mexican Spanish',
		bcp47Code: 'es-MX',
		speakerEmoji: '🇲🇽',
		gender: 'male',
		voiceName: 'Mateo',
		voiceProviderId: 'aws-mateo',
		isActive: true
	},
	{
		id: 'es-mx-female',
		languageId: 'es',
		region: 'Mexico',
		dialectName: 'Mexican Spanish',
		bcp47Code: 'es-MX',
		speakerEmoji: '🇲🇽',
		gender: 'female',
		voiceName: 'Valentina',
		voiceProviderId: 'aws-valentina',
		isActive: true
	},

	// --- Chinese (Mandarin) Speakers ---
	{
		id: 'zh-cn-male',
		languageId: 'zh',
		region: 'Mainland China',
		dialectName: 'Mandarin (Standard)',
		bcp47Code: 'zh-CN',
		speakerEmoji: '🇨🇳',
		gender: 'male',
		voiceName: 'Wei',
		voiceProviderId: 'azure-wei',
		isActive: true
	},
	{
		id: 'zh-cn-female',
		languageId: 'zh',
		region: 'Mainland China',
		dialectName: 'Mandarin (Standard)',
		bcp47Code: 'zh-CN',
		speakerEmoji: '🇨🇳',
		gender: 'female',
		voiceName: 'Xiaoxiao',
		voiceProviderId: 'azure-xiaoxiao',
		isActive: true
	},
	{
		id: 'zh-tw-male',
		languageId: 'zh',
		region: 'Taiwan',
		dialectName: 'Taiwanese Mandarin',
		bcp47Code: 'zh-TW',
		speakerEmoji: '🇹🇼',
		gender: 'male',
		voiceName: 'Chen',
		voiceProviderId: 'google-chen',
		isActive: true
	},
	{
		id: 'zh-tw-female',
		languageId: 'zh',
		region: 'Taiwan',
		dialectName: 'Taiwanese Mandarin',
		bcp47Code: 'zh-TW',
		speakerEmoji: '🇹🇼',
		gender: 'female',
		voiceName: 'Hsiao-Mei',
		voiceProviderId: 'google-hsiao-mei',
		isActive: true
	},

	// --- French Speakers ---
	{
		id: 'fr-fr-male',
		languageId: 'fr',
		region: 'France',
		dialectName: 'French',
		bcp47Code: 'fr-FR',
		speakerEmoji: '🇫🇷',
		gender: 'male',
		voiceName: 'Louis',
		voiceProviderId: 'openai-louis',
		isActive: true
	},
	{
		id: 'fr-fr-female',
		languageId: 'fr',
		region: 'France',
		dialectName: 'French',
		bcp47Code: 'fr-FR',
		speakerEmoji: '🇫🇷',
		gender: 'female',
		voiceName: 'Chloé',
		voiceProviderId: 'openai-chloe',
		isActive: true
	},

	// --- Korean Speakers ---
	{
		id: 'ko-kr-male',
		languageId: 'ko',
		region: 'South Korea',
		dialectName: 'Korean',
		bcp47Code: 'ko-KR',
		speakerEmoji: '🇰🇷',
		gender: 'male',
		voiceName: 'Min-jun',
		voiceProviderId: 'openai-minjun',
		isActive: true
	},
	{
		id: 'ko-kr-female',
		languageId: 'ko',
		region: 'South Korea',
		dialectName: 'Korean',
		bcp47Code: 'ko-KR',
		speakerEmoji: '🇰🇷',
		gender: 'female',
		voiceName: 'Seo-yeon',
		voiceProviderId: 'openai-seoyeon',
		isActive: true
	},

	// --- German Speakers ---
	{
		id: 'de-de-male',
		languageId: 'de',
		region: 'Germany',
		dialectName: 'German',
		bcp47Code: 'de-DE',
		speakerEmoji: '🇩🇪',
		gender: 'male',
		voiceName: 'Lukas',
		voiceProviderId: 'openai-lukas',
		isActive: true
	},
	{
		id: 'de-de-female',
		languageId: 'de',
		region: 'Germany',
		dialectName: 'German',
		bcp47Code: 'de-DE',
		speakerEmoji: '🇩🇪',
		gender: 'female',
		voiceName: 'Hanna',
		voiceProviderId: 'openai-hanna',
		isActive: true
	},

	// --- Portuguese Speakers ---
	{
		id: 'pt-br-male',
		languageId: 'pt',
		region: 'Brazil',
		dialectName: 'Brazilian Portuguese',
		bcp47Code: 'pt-BR',
		speakerEmoji: '🇧🇷',
		gender: 'male',
		voiceName: 'Lucas',
		voiceProviderId: 'openai-lucas',
		isActive: true
	},
	{
		id: 'pt-br-female',
		languageId: 'pt',
		region: 'Brazil',
		dialectName: 'Brazilian Portuguese',
		bcp47Code: 'pt-BR',
		speakerEmoji: '🇧🇷',
		gender: 'female',
		voiceName: 'Isabella',
		voiceProviderId: 'openai-isabella',
		isActive: true
	},
	{
		id: 'pt-pt-male',
		languageId: 'pt',
		region: 'Portugal',
		dialectName: 'European Portuguese',
		bcp47Code: 'pt-PT',
		speakerEmoji: '🇵🇹',
		gender: 'male',
		voiceName: 'Tiago',
		voiceProviderId: 'azure-tiago',
		isActive: true
	},
	{
		id: 'pt-pt-female',
		languageId: 'pt',
		region: 'Portugal',
		dialectName: 'European Portuguese',
		bcp47Code: 'pt-PT',
		speakerEmoji: '🇵🇹',
		gender: 'female',
		voiceName: 'Beatriz',
		voiceProviderId: 'azure-beatriz',
		isActive: true
	},

	// --- Italian Speakers ---
	{
		id: 'it-it-male',
		languageId: 'it',
		region: 'Italy',
		dialectName: 'Italian',
		bcp47Code: 'it-IT',
		speakerEmoji: '🇮🇹',
		gender: 'male',
		voiceName: 'Leonardo',
		voiceProviderId: 'openai-leonardo',
		isActive: true
	},
	{
		id: 'it-it-female',
		languageId: 'it',
		region: 'Italy',
		dialectName: 'Italian',
		bcp47Code: 'it-IT',
		speakerEmoji: '🇮🇹',
		gender: 'female',
		voiceName: 'Giulia',
		voiceProviderId: 'openai-giulia',
		isActive: true
	},

	// --- Vietnamese Speakers ---
	{
		id: 'vi-vn-male',
		languageId: 'vi',
		region: 'Vietnam',
		dialectName: 'Vietnamese',
		bcp47Code: 'vi-VN',
		speakerEmoji: '🇻🇳',
		gender: 'male',
		voiceName: 'Anh',
		voiceProviderId: 'openai-anh',
		isActive: true
	},
	{
		id: 'vi-vn-female',
		languageId: 'vi',
		region: 'Vietnam',
		dialectName: 'Vietnamese',
		bcp47Code: 'vi-VN',
		speakerEmoji: '🇻🇳',
		gender: 'female',
		voiceName: 'Linh',
		voiceProviderId: 'openai-linh',
		isActive: true
	},

	// --- Dutch Speakers ---
	{
		id: 'nl-nl-male',
		languageId: 'nl',
		region: 'Netherlands',
		dialectName: 'Dutch',
		bcp47Code: 'nl-NL',
		speakerEmoji: '🇳🇱',
		gender: 'male',
		voiceName: 'Daan',
		voiceProviderId: 'openai-daan',
		isActive: true
	},
	{
		id: 'nl-nl-female',
		languageId: 'nl',
		region: 'Netherlands',
		dialectName: 'Dutch',
		bcp47Code: 'nl-NL',
		speakerEmoji: '🇳🇱',
		gender: 'female',
		voiceName: 'Sophie',
		voiceProviderId: 'openai-sophie',
		isActive: true
	},

	// --- Filipino Speakers ---
	{
		id: 'fil-ph-male',
		languageId: 'fil',
		region: 'Philippines',
		dialectName: 'Filipino',
		bcp47Code: 'fil-PH',
		speakerEmoji: '🇵🇭',
		gender: 'male',
		voiceName: 'Juan',
		voiceProviderId: 'openai-juan',
		isActive: true
	},
	{
		id: 'fil-ph-female',
		languageId: 'fil',
		region: 'Philippines',
		dialectName: 'Filipino',
		bcp47Code: 'fil-PH',
		speakerEmoji: '🇵🇭',
		gender: 'female',
		voiceName: 'Maria',
		voiceProviderId: 'openai-maria',
		isActive: true
	},

	// --- Hindi Speakers ---
	{
		id: 'hi-in-male',
		languageId: 'hi',
		region: 'India',
		dialectName: 'Hindi',
		bcp47Code: 'hi-IN',
		speakerEmoji: '🇮🇳',
		gender: 'male',
		voiceName: 'Aarav',
		voiceProviderId: 'openai-aarav',
		isActive: true
	},
	{
		id: 'hi-in-female',
		languageId: 'hi',
		region: 'India',
		dialectName: 'Hindi',
		bcp47Code: 'hi-IN',
		speakerEmoji: '🇮🇳',
		gender: 'female',
		voiceName: 'Saanvi',
		voiceProviderId: 'openai-saanvi',
		isActive: true
	},

	// --- Arabic Speakers ---
	{
		id: 'ar-sa-male',
		languageId: 'ar',
		region: 'Saudi Arabia',
		dialectName: 'Arabic',
		bcp47Code: 'ar-SA',
		speakerEmoji: '🇸🇦',
		gender: 'male',
		voiceName: 'Omar',
		voiceProviderId: 'openai-omar',
		isActive: true
	},
	{
		id: 'ar-sa-female',
		languageId: 'ar',
		region: 'Saudi Arabia',
		dialectName: 'Arabic',
		bcp47Code: 'ar-SA',
		speakerEmoji: '🇸🇦',
		gender: 'female',
		voiceName: 'Fatima',
		voiceProviderId: 'openai-fatima',
		isActive: true
	},

	// --- Russian Speakers ---
	{
		id: 'ru-ru-male',
		languageId: 'ru',
		region: 'Russia',
		dialectName: 'Russian',
		bcp47Code: 'ru-RU',
		speakerEmoji: '🇷🇺',
		gender: 'male',
		voiceName: 'Dmitri',
		voiceProviderId: 'openai-dmitri',
		isActive: true
	},
	{
		id: 'ru-ru-female',
		languageId: 'ru',
		region: 'Russia',
		dialectName: 'Russian',
		bcp47Code: 'ru-RU',
		speakerEmoji: '🇷🇺',
		gender: 'female',
		voiceName: 'Svetlana',
		voiceProviderId: 'openai-svetlana',
		isActive: true
	},

	// --- Indonesian Speakers ---
	{
		id: 'id-id-male',
		languageId: 'id',
		region: 'Indonesia',
		dialectName: 'Indonesian',
		bcp47Code: 'id-ID',
		speakerEmoji: '🇮🇩',
		gender: 'male',
		voiceName: 'Budi',
		voiceProviderId: 'openai-budi',
		isActive: true
	},
	{
		id: 'id-id-female',
		languageId: 'id',
		region: 'Indonesia',
		dialectName: 'Indonesian',
		bcp47Code: 'id-ID',
		speakerEmoji: '🇮🇩',
		gender: 'female',
		voiceName: 'Citra',
		voiceProviderId: 'openai-citra',
		isActive: true
	},

	// --- Turkish Speakers ---
	{
		id: 'tr-tr-male',
		languageId: 'tr',
		region: 'Turkey',
		dialectName: 'Turkish',
		bcp47Code: 'tr-TR',
		speakerEmoji: '🇹🇷',
		gender: 'male',
		voiceName: 'Mehmet',
		voiceProviderId: 'openai-mehmet',
		isActive: true
	},
	{
		id: 'tr-tr-female',
		languageId: 'tr',
		region: 'Turkey',
		dialectName: 'Turkish',
		bcp47Code: 'tr-TR',
		speakerEmoji: '🇹🇷',
		gender: 'female',
		voiceName: 'Zeynep',
		voiceProviderId: 'openai-zeynep',
		isActive: true
	}
];

// Helper function to get speakers by language
export function getSpeakersByLanguage(languageId: string): Speaker[] {
	return speakers.filter((speaker) => speaker.languageId === languageId && speaker.isActive);
}

// Helper function to get speaker by id
export function getSpeakerById(id: string): Speaker | undefined {
	return speakers.find((speaker) => speaker.id === id);
}

// Helper function to get default speaker for a language
export function getDefaultSpeakerForLanguage(languageId: string): Speaker | undefined {
	const languageSpeakers = getSpeakersByLanguage(languageId);
	return languageSpeakers[0]; // Return first available speaker
}

