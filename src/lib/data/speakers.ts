// 🗣️ Speaker Data
// All speakers from kaiwa-old with voice provider information
//
// Valid OpenAI Realtime API voices:
// - alloy, ash, ballad, coral, echo, sage, shimmer, verse
//
// Note: 'fable', 'ash', 'nova' are NOT supported by OpenAI Realtime API
// They are only available in OpenAI TTS API

import type { Speaker } from '$lib/types';

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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'ash',
		language: '',
		voiceId: ''
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
		openAIId: 'shimmer',
		language: '',
		voiceId: ''
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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'ash',
		language: '',
		voiceId: ''
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
		openAIId: 'shimmer',
		language: '',
		voiceId: ''
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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'ash',
		language: '',
		voiceId: ''
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
		openAIId: 'shimmer',
		language: '',
		voiceId: ''
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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'ash',
		language: '',
		voiceId: ''
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
		openAIId: 'shimmer',
		language: '',
		voiceId: ''
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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'ash',
		language: '',
		voiceId: ''
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
		openAIId: 'shimmer',
		language: '',
		voiceId: ''
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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'ash',
		language: '',
		voiceId: ''
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
		openAIId: 'shimmer',
		language: '',
		voiceId: ''
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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'ash',
		language: '',
		voiceId: ''
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
		openAIId: 'shimmer',
		language: '',
		voiceId: ''
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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'alloy',
		language: '',
		voiceId: ''
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
		openAIId: 'echo',
		language: '',
		voiceId: ''
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
		openAIId: 'ash',
		language: '',
		voiceId: ''
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
		openAIId: 'shimmer',
		language: '',
		voiceId: ''
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
