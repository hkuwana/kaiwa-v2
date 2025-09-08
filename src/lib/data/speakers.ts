// 🗣️ Speaker Data
// All speakers from kaiwa-old with voice provider information
//
// Valid OpenAI Realtime API voices:
// - alloy, ash, ballad, coral, echo, sage, shimmer, verse
//
// Note: 'fable', 'ash', 'nova' are NOT supported by OpenAI Realtime API
// They are only available in OpenAI TTS API

import type { Speaker } from '$lib/server/db/types';

export const speakersData: Speaker[] = [
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
	},
	{
		id: 'ja-jp-osaka',
		languageId: 'ja',
		region: 'Osaka',
		dialectName: 'Osaka Japanese',
		bcp47Code: 'ja-JP',
		speakerEmoji: '🏯',
		gender: 'female',
		voiceName: 'Minami',
		voiceProviderId: 'openai-osaka',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'shimmer',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'shimmer',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'shimmer',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'shimmer',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'shimmer',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'shimmer',
		isActive: false,
		createdAt: null
	},
	{
		id: 'nl-amsterdam-male',
		languageId: 'nl',
		region: 'Amsterdam',
		dialectName: 'Amsterdam Dutch',
		bcp47Code: 'nl-NL',
		speakerEmoji: '🏛️',
		gender: 'male',
		voiceName: 'Jasper',
		voiceProviderId: 'openai-jasper',
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
	},
	{
		id: 'nl-amsterdam-female',
		languageId: 'nl',
		region: 'Amsterdam',
		dialectName: 'Amsterdam Dutch',
		bcp47Code: 'nl-NL',
		speakerEmoji: '🏛️',
		gender: 'female',
		voiceName: 'Fleur',
		voiceProviderId: 'openai-fleur',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
	},
	{
		id: 'nl-antwerp-male',
		languageId: 'nl',
		region: 'Antwerp',
		dialectName: 'Flemish',
		bcp47Code: 'nl-BE',
		speakerEmoji: '🏰',
		gender: 'male',
		voiceName: 'Lars',
		voiceProviderId: 'openai-lars',
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null
	},
	{
		id: 'nl-antwerp-female',
		languageId: 'nl',
		region: 'Antwerp',
		dialectName: 'Flemish',
		bcp47Code: 'nl-BE',
		speakerEmoji: '🏰',
		gender: 'female',
		voiceName: 'Eva',
		voiceProviderId: 'openai-eva',
		openaiVoiceId: 'shimmer',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null
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
		openaiVoiceId: 'shimmer',
		isActive: false,
		createdAt: null
	}
];

// Helper function to get speakers by language
export function getSpeakersByLanguage(languageId: string): Speaker[] {
	return speakersData.filter((speaker) => speaker.languageId === languageId);
}

// Helper function to get speaker by id
export function getSpeakerById(id: string): Speaker | undefined {
	return speakersData.find((speaker) => speaker.id === id);
}

// Helper function to get default speaker for a language
export function getDefaultSpeakerForLanguage(languageId: string): Speaker | undefined {
	const languageSpeakers = getSpeakersByLanguage(languageId);
	return languageSpeakers[0]; // Return first available speaker
}
