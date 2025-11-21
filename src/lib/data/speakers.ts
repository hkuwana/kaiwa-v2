// 🗣️ Speaker Data
// All speakers from kaiwa-old with voice provider information
//
// Valid OpenAI Realtime API voices:
// - alloy, ash, ballad, coral, echo, sage, sage, verse
//
// Note: 'fable', 'ash', 'nova' are NOT supported by OpenAI Realtime API
// They are only available in OpenAI TTS API

import type { Speaker } from '$lib/server/db/types';
import type { Scenario } from '$lib/data/scenarios';

export const speakersData: Speaker[] = [
	// --- Japanese Speakers ---
	{
		id: 'ja-jp-male',
		languageId: 'ja',
		region: 'Tokyo',
		dialectName: 'Japanese (Standard)',
		bcp47Code: 'ja-JP',
		speakerEmoji: '🇯🇵',
		gender: 'male',
		voiceName: 'Hiro',
		voiceProviderId: 'openai-hiro',
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/hiro-speaker.webp',
		characterImageAlt: 'Image of Hiro'
	},
	{
		id: 'ja-jp-female',
		languageId: 'ja',
		region: 'Tokyo',
		dialectName: 'Japanese (Standard)',
		bcp47Code: 'ja-JP',
		speakerEmoji: '🇯🇵',
		gender: 'female',
		voiceName: 'Yuki',
		voiceProviderId: 'openai-yuki',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/yuki-speaker.webp',
		characterImageAlt: 'Image of Yuki'
	},
	{
		id: 'ja-jp-osaka-female',
		languageId: 'ja',
		region: 'Osaka',
		dialectName: 'Kansai',
		bcp47Code: 'ja-JP',
		speakerEmoji: '🏯',
		gender: 'female',
		voiceName: 'Minami',
		voiceProviderId: 'openai-osaka',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/minami-speaker.webp',
		characterImageAlt: 'Image of Minami'
	},
	{
		id: 'ja-jp-osaka-male',
		languageId: 'ja',
		region: 'Osaka',
		dialectName: 'Kansai',
		bcp47Code: 'ja-JP',
		speakerEmoji: '🏯',
		gender: 'male',
		voiceName: 'Kenta',
		voiceProviderId: 'openai-kenta',
		openaiVoiceId: 'verse',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/kenta-speaker.webp',
		characterImageAlt: 'Image of Kenta'
	},
	{
		id: 'ja-jp-okinawa-male',
		languageId: 'ja',
		region: 'Okinawa',
		dialectName: 'Okinawan',
		bcp47Code: 'ja-JP',
		speakerEmoji: '🌺',
		gender: 'male',
		voiceName: 'Kaito',
		voiceProviderId: 'openai-kaito',
		openaiVoiceId: 'ballad',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/kaito-speaker.webp',
		characterImageAlt: 'Image of Kaito'
	},
	{
		id: 'ja-jp-okinawa-female',
		languageId: 'ja',
		region: 'Okinawa',
		dialectName: 'Okinawan',
		bcp47Code: 'ja-JP',
		speakerEmoji: '🌺',
		gender: 'female',
		voiceName: 'Hina',
		voiceProviderId: 'openai-hina',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/hina-speaker.webp',
		characterImageAlt: 'Image of Hina'
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
		createdAt: null,
		characterImageUrl: '/speakers/matthew-speaker.webp',
		characterImageAlt: 'Image of Matthew'
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
		createdAt: null,
		characterImageUrl: '/speakers/emily-speaker.webp',
		characterImageAlt: 'Image of Emily'
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
		createdAt: null,
		characterImageUrl: '/speakers/james-speaker.webp',
		characterImageAlt: 'Image of James'
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/charlotte-speaker.webp',
		characterImageAlt: 'Image of Charlotte'
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
		createdAt: null,
		characterImageUrl: '/speakers/javier-speaker.webp',
		characterImageAlt: 'Image of Javier'
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
		createdAt: null,
		characterImageUrl: '/speakers/sofia-speaker.webp',
		characterImageAlt: 'Image of Sofia'
	},
	{
		id: 'es-mx-male',
		languageId: 'es',
		region: 'Mexico City',
		dialectName: 'Mexican Spanish',
		bcp47Code: 'es-MX',
		speakerEmoji: '🇲🇽',
		gender: 'male',
		voiceName: 'Mateo',
		voiceProviderId: 'aws-mateo',
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/mateo-speaker.webp',
		characterImageAlt: 'Image of Mateo'
	},
	{
		id: 'es-mx-female',
		languageId: 'es',
		region: 'Mexico City',
		dialectName: 'Mexican Spanish',
		bcp47Code: 'es-MX',
		speakerEmoji: '🇲🇽',
		gender: 'female',
		voiceName: 'Valentina',
		voiceProviderId: 'aws-valentina',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/valentina-speaker.webp',
		characterImageAlt: 'Image of Valentina'
	},
	{
		id: 'es-co-male',
		languageId: 'es',
		region: 'Bogotá',
		dialectName: 'Colombian Spanish',
		bcp47Code: 'es-CO',
		speakerEmoji: '🇨🇴',
		gender: 'male',
		voiceName: 'Santiago',
		voiceProviderId: 'openai-santiago',
		openaiVoiceId: 'verse',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/santiago-speaker.webp',
		characterImageAlt: 'Image of Santiago'
	},
	{
		id: 'es-co-female',
		languageId: 'es',
		region: 'Bogotá',
		dialectName: 'Colombian Spanish',
		bcp47Code: 'es-CO',
		speakerEmoji: '🇨🇴',
		gender: 'female',
		voiceName: 'Isabella',
		voiceProviderId: 'openai-isabella-co',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/isabella-speaker.webp',
		characterImageAlt: 'Image of Isabella'
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
		createdAt: null,
		characterImageUrl: '/speakers/wei-speaker.webp',
		characterImageAlt: 'Image of Wei'
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
		createdAt: null,
		characterImageUrl: '/speakers/xiaoxiao-speaker.webp',
		characterImageAlt: 'Image of Xiaoxiao'
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
		createdAt: null,
		characterImageUrl: '/speakers/chen-speaker.webp',
		characterImageAlt: 'Image of Chen'
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/hsiao-mei-speaker.webp',
		characterImageAlt: 'Image of Hsiao-Mei'
	},

	// --- French Speakers ---
	{
		id: 'fr-fr-male',
		languageId: 'fr',
		region: 'Paris',
		dialectName: 'Parisian French',
		bcp47Code: 'fr-FR',
		speakerEmoji: '🇫🇷',
		gender: 'male',
		voiceName: 'Louis',
		voiceProviderId: 'openai-louis',
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/louis-speaker.webp',
		characterImageAlt: 'Image of Louis'
	},
	{
		id: 'fr-fr-female',
		languageId: 'fr',
		region: 'Paris',
		dialectName: 'Parisian French',
		bcp47Code: 'fr-FR',
		speakerEmoji: '🇫🇷',
		gender: 'female',
		voiceName: 'Chloé',
		voiceProviderId: 'openai-chloe',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/chloe-speaker.webp',
		characterImageAlt: 'Image of Chloé'
	},
	{
		id: 'fr-ca-male',
		languageId: 'fr',
		region: 'Quebec',
		dialectName: 'Canadian French',
		bcp47Code: 'fr-CA',
		speakerEmoji: '🇨🇦',
		gender: 'male',
		voiceName: 'Félix',
		voiceProviderId: 'openai-felix',
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/felix-speaker.webp',
		characterImageAlt: 'Image of Félix'
	},
	{
		id: 'fr-ca-female',
		languageId: 'fr',
		region: 'Quebec',
		dialectName: 'Canadian French',
		bcp47Code: 'fr-CA',
		speakerEmoji: '🇨🇦',
		gender: 'female',
		voiceName: 'Amélie',
		voiceProviderId: 'openai-amelie',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/amelie-speaker.webp',
		characterImageAlt: 'Image of Amélie'
	},

	// --- Korean Speakers ---
	{
		id: 'ko-kr-male',
		languageId: 'ko',
		region: 'Seoul',
		dialectName: 'Seoul Korean (Standard)',
		bcp47Code: 'ko-KR',
		speakerEmoji: '🇰🇷',
		gender: 'male',
		voiceName: 'Min-jun',
		voiceProviderId: 'openai-minjun',
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/min-jun-speaker.webp',
		characterImageAlt: 'Image of Min-jun'
	},
	{
		id: 'ko-kr-female',
		languageId: 'ko',
		region: 'Seoul',
		dialectName: 'Seoul Korean (Standard)',
		bcp47Code: 'ko-KR',
		speakerEmoji: '🇰🇷',
		gender: 'female',
		voiceName: 'Seo-yeon',
		voiceProviderId: 'openai-seoyeon',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/seo-yeon-speaker.webp',
		characterImageAlt: 'Image of Seo-yeon'
	},
	{
		id: 'ko-kr-busan-male',
		languageId: 'ko',
		region: 'Busan',
		dialectName: 'Busan Korean',
		bcp47Code: 'ko-KR',
		speakerEmoji: '🌊',
		gender: 'male',
		voiceName: 'Ji-hoon',
		voiceProviderId: 'openai-jihoon',
		openaiVoiceId: 'verse',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/ji-hoon-speaker.webp',
		characterImageAlt: 'Image of Ji-hoon'
	},
	{
		id: 'ko-kr-busan-female',
		languageId: 'ko',
		region: 'Busan',
		dialectName: 'Busan Korean',
		bcp47Code: 'ko-KR',
		speakerEmoji: '🌊',
		gender: 'female',
		voiceName: 'Soo-jin',
		voiceProviderId: 'openai-soojin',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/soo-jin-speaker.webp',
		characterImageAlt: 'Image of Soo-jin'
	},

	// --- German Speakers ---
	{
		id: 'de-de-standard-male',
		languageId: 'de',
		region: 'Germany',
		dialectName: 'Standard German',
		bcp47Code: 'de-DE',
		speakerEmoji: '🇩🇪',
		gender: 'male',
		voiceName: 'Lukas',
		voiceProviderId: 'openai-lukas',
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/lukas-speaker.webp',
		characterImageAlt: 'Image of Lukas'
	},
	{
		id: 'de-de-standard-female',
		languageId: 'de',
		region: 'Germany',
		dialectName: 'Standard German',
		bcp47Code: 'de-DE',
		speakerEmoji: '🇩🇪',
		gender: 'female',
		voiceName: 'Hanna',
		voiceProviderId: 'openai-hanna',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/hanna-speaker.webp',
		characterImageAlt: 'Image of Hanna'
	},
	{
		id: 'de-de-berlin-male',
		languageId: 'de',
		region: 'Berlin',
		dialectName: 'Berlin German',
		bcp47Code: 'de-DE',
		speakerEmoji: '🐻',
		gender: 'male',
		voiceName: 'Klaus',
		voiceProviderId: 'openai-klaus',
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/klaus-speaker.webp',
		characterImageAlt: 'Image of Klaus'
	},
	{
		id: 'de-de-berlin-female',
		languageId: 'de',
		region: 'Berlin',
		dialectName: 'Berlin German',
		bcp47Code: 'de-DE',
		speakerEmoji: '🐻',
		gender: 'female',
		voiceName: 'Monika',
		voiceProviderId: 'openai-monika',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/monika-speaker.webp',
		characterImageAlt: 'Image of Monika'
	},
	{
		id: 'de-de-munich-male',
		languageId: 'de',
		region: 'Munich',
		dialectName: 'Bavarian German',
		bcp47Code: 'de-DE',
		speakerEmoji: '🥨',
		gender: 'male',
		voiceName: 'Stefan',
		voiceProviderId: 'openai-stefan',
		openaiVoiceId: 'verse',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/stefan-speaker.webp',
		characterImageAlt: 'Image of Stefan'
	},
	{
		id: 'de-de-munich-female',
		languageId: 'de',
		region: 'Munich',
		dialectName: 'Bavarian German',
		bcp47Code: 'de-DE',
		speakerEmoji: '🥨',
		gender: 'female',
		voiceName: 'Anja',
		voiceProviderId: 'openai-anja',
		openaiVoiceId: 'ballad',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/anja-speaker.webp',
		characterImageAlt: 'Image of Anja'
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
		createdAt: null,
		characterImageUrl: '/speakers/lucas-speaker.webp',
		characterImageAlt: 'Image of Lucas'
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
		createdAt: null,
		characterImageUrl: '/speakers/isabella-speaker.webp',
		characterImageAlt: 'Image of Isabella'
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
		createdAt: null,
		characterImageUrl: '/speakers/tiago-speaker.webp',
		characterImageAlt: 'Image of Tiago'
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/beatriz-speaker.webp',
		characterImageAlt: 'Image of Beatriz'
	},

	// --- Italian Speakers ---
	{
		id: 'it-it-standard-male',
		languageId: 'it',
		region: 'Italy',
		dialectName: 'Standard Italian',
		bcp47Code: 'it-IT',
		speakerEmoji: '🇮🇹',
		gender: 'male',
		voiceName: 'Leonardo',
		voiceProviderId: 'openai-leonardo',
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/leonardo-speaker.webp',
		characterImageAlt: 'Image of Leonardo'
	},
	{
		id: 'it-it-standard-female',
		languageId: 'it',
		region: 'Italy',
		dialectName: 'Standard Italian',
		bcp47Code: 'it-IT',
		speakerEmoji: '🇮🇹',
		gender: 'female',
		voiceName: 'Giulia',
		voiceProviderId: 'openai-giulia',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/giulia-speaker.webp',
		characterImageAlt: 'Image of Giulia'
	},
	{
		id: 'it-it-rome-male',
		languageId: 'it',
		region: 'Rome',
		dialectName: 'Roman Italian',
		bcp47Code: 'it-IT',
		speakerEmoji: '🏛️',
		gender: 'male',
		voiceName: 'Marco',
		voiceProviderId: 'openai-marco',
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/marco-speaker.webp',
		characterImageAlt: 'Image of Marco'
	},
	{
		id: 'it-it-rome-female',
		languageId: 'it',
		region: 'Rome',
		dialectName: 'Roman Italian',
		bcp47Code: 'it-IT',
		speakerEmoji: '🏛️',
		gender: 'female',
		voiceName: 'Francesca',
		voiceProviderId: 'openai-francesca',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/francesca-speaker.webp',
		characterImageAlt: 'Image of Francesca'
	},
	{
		id: 'it-it-milan-male',
		languageId: 'it',
		region: 'Milan',
		dialectName: 'Milanese Italian',
		bcp47Code: 'it-IT',
		speakerEmoji: '⛪',
		gender: 'male',
		voiceName: 'Alessandro',
		voiceProviderId: 'openai-alessandro',
		openaiVoiceId: 'verse',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/alessandro-speaker.webp',
		characterImageAlt: 'Image of Alessandro'
	},
	{
		id: 'it-it-milan-female',
		languageId: 'it',
		region: 'Milan',
		dialectName: 'Milanese Italian',
		bcp47Code: 'it-IT',
		speakerEmoji: '⛪',
		gender: 'female',
		voiceName: 'Chiara',
		voiceProviderId: 'openai-chiara',
		openaiVoiceId: 'ballad',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/chiara-speaker.webp',
		characterImageAlt: 'Image of Chiara'
	},

	// --- Vietnamese Speakers ---
	{
		id: 'vi-vn-hanoi-male',
		languageId: 'vi',
		region: 'Hanoi',
		dialectName: 'Northern Vietnamese',
		bcp47Code: 'vi-VN',
		speakerEmoji: '🇻🇳',
		gender: 'male',
		voiceName: 'Nam',
		voiceProviderId: 'openai-nam',
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/nam-speaker.webp',
		characterImageAlt: 'Image of Nam'
	},
	{
		id: 'vi-vn-hanoi-female',
		languageId: 'vi',
		region: 'Hanoi',
		dialectName: 'Northern Vietnamese',
		bcp47Code: 'vi-VN',
		speakerEmoji: '🇻🇳',
		gender: 'female',
		voiceName: 'Mai',
		voiceProviderId: 'openai-mai',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/mai-speaker.webp',
		characterImageAlt: 'Image of Mai'
	},
	{
		id: 'vi-vn-hcmc-male',
		languageId: 'vi',
		region: 'Saigon',
		dialectName: 'Southern Vietnamese',
		bcp47Code: 'vi-VN',
		speakerEmoji: '🛵',
		gender: 'male',
		voiceName: 'bao',
		voiceProviderId: 'openai-bao',
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/bao-speaker.webp',
		characterImageAlt: 'Image of bao'
	},
	{
		id: 'vi-vn-hcmc-female',
		languageId: 'vi',
		region: 'Saigon',
		dialectName: 'Southern Vietnamese',
		bcp47Code: 'vi-VN',
		speakerEmoji: '🛵',
		gender: 'female',
		voiceName: 'Ngoc',
		voiceProviderId: 'openai-ngoc',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/ngoc-speaker.webp',
		characterImageAlt: 'Image of Ngoc'
	},

	// --- Dutch Speakers ---
	{
		id: 'nl-nl-male',
		languageId: 'nl',
		region: 'Netherlands',
		dialectName: 'Dutch (Standard)',
		bcp47Code: 'nl-NL',
		speakerEmoji: '🇳🇱',
		gender: 'male',
		voiceName: 'Daan',
		voiceProviderId: 'openai-daan',
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/daan-speaker.webp',
		characterImageAlt: 'Image of Daan'
	},
	{
		id: 'nl-nl-female',
		languageId: 'nl',
		region: 'Netherlands',
		dialectName: 'Dutch (Standard)',
		bcp47Code: 'nl-NL',
		speakerEmoji: '🇳🇱',
		gender: 'female',
		voiceName: 'Sophie',
		voiceProviderId: 'openai-sophie',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/sophie-speaker.webp',
		characterImageAlt: 'Image of Sophie'
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
		createdAt: null,
		characterImageUrl: '/speakers/jasper-speaker.webp',
		characterImageAlt: 'Image of Jasper'
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
		createdAt: null,
		characterImageUrl: '/speakers/fleur-speaker.webp',
		characterImageAlt: 'Image of Fleur'
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
		createdAt: null,
		characterImageUrl: '/speakers/lars-speaker.webp',
		characterImageAlt: 'Image of Lars'
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
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/eva-speaker.webp',
		characterImageAlt: 'Image of Juan'
	},

	// --- Filipino Speakers ---
	{
		id: 'fil-ph-standard-male',
		languageId: 'fil',
		region: 'Philippines',
		dialectName: 'Standard Filipino',
		bcp47Code: 'fil-PH',
		speakerEmoji: '🇵🇭',
		gender: 'male',
		voiceName: 'Juan',
		voiceProviderId: 'openai-juan',
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/juan-speaker.webp',
		characterImageAlt: 'Image of Juan'
	},
	{
		id: 'fil-ph-standard-female',
		languageId: 'fil',
		region: 'Philippines',
		dialectName: 'Standard Filipino',
		bcp47Code: 'fil-PH',
		speakerEmoji: '🇵🇭',
		gender: 'female',
		voiceName: 'Maria',
		voiceProviderId: 'openai-maria',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/maria-speaker.webp',
		characterImageAlt: 'Image of Maria'
	},
	{
		id: 'fil-ph-manila-male',
		languageId: 'fil',
		region: 'Manila',
		dialectName: 'Manila Filipino',
		bcp47Code: 'fil-PH',
		speakerEmoji: '🏙️',
		gender: 'male',
		voiceName: 'Jose',
		voiceProviderId: 'openai-jose',
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/jose-speaker.webp',
		characterImageAlt: 'Image of Jose'
	},
	{
		id: 'fil-ph-manila-female',
		languageId: 'fil',
		region: 'Manila',
		dialectName: 'Manila Filipino',
		bcp47Code: 'fil-PH',
		speakerEmoji: '🏙️',
		gender: 'female',
		voiceName: 'Lani',
		voiceProviderId: 'openai-sofia-fil',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/lani-speaker.webp',
		characterImageAlt: 'Image of Lani'
	},

	// --- Hindi Speakers ---
	{
		id: 'hi-in-standard-male',
		languageId: 'hi',
		region: 'India',
		dialectName: 'Standard Hindi',
		bcp47Code: 'hi-IN',
		speakerEmoji: '🇮🇳',
		gender: 'male',
		voiceName: 'Arjun',
		voiceProviderId: 'openai-arjun',
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/arjun-speaker.webp',
		characterImageAlt: 'Image of Arjun'
	},
	{
		id: 'hi-in-standard-female',
		languageId: 'hi',
		region: 'India',
		dialectName: 'Standard Hindi',
		bcp47Code: 'hi-IN',
		speakerEmoji: '🇮🇳',
		gender: 'female',
		voiceName: 'Diya',
		voiceProviderId: 'openai-priya',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/diya-speaker.webp',
		characterImageAlt: 'Image of Diya'
	},
	{
		id: 'hi-in-mumbai-male',
		languageId: 'hi',
		region: 'Mumbai',
		dialectName: 'Mumbai Hindi',
		bcp47Code: 'hi-IN',
		speakerEmoji: '🎬',
		gender: 'male',
		voiceName: 'Rohan',
		voiceProviderId: 'openai-rohan',
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/rohan-speaker.webp',
		characterImageAlt: 'Image of Rohan'
	},
	{
		id: 'hi-in-mumbai-female',
		languageId: 'hi',
		region: 'Mumbai',
		dialectName: 'Mumbai Hindi',
		bcp47Code: 'hi-IN',
		speakerEmoji: '🎬',
		gender: 'female',
		voiceName: 'Priya',
		voiceProviderId: 'openai-priya',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/priya-speaker.webp',
		characterImageAlt: 'Image of Priya'
	},

	// --- Russian Speakers ---
	{
		id: 'ru-ru-standard-male',
		languageId: 'ru',
		region: 'Russia',
		dialectName: 'Standard Russian',
		bcp47Code: 'ru-RU',
		speakerEmoji: '🇷🇺',
		gender: 'male',
		voiceName: 'Dmitri',
		voiceProviderId: 'openai-dmitri',
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/dmitri-speaker.webp',
		characterImageAlt: 'image of Dmitri'
	},
	{
		id: 'ru-ru-standard-female',
		languageId: 'ru',
		region: 'Russia',
		dialectName: 'Standard Russian',
		bcp47Code: 'ru-RU',
		speakerEmoji: '🇷🇺',
		gender: 'female',
		voiceName: 'Elena',
		voiceProviderId: 'openai-elena',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/elena-speaker.webp',
		characterImageAlt: 'Image of Elena'
	},
	{
		id: 'ru-ru-stpetersburg-male',
		languageId: 'ru',
		region: 'Saint Petersburg',
		dialectName: 'Saint Petersburg',
		bcp47Code: 'ru-RU',
		speakerEmoji: '🌉',
		gender: 'male',
		voiceName: 'Ivan',
		voiceProviderId: 'openai-ivan',
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/ivan-speaker.webp',
		characterImageAlt: 'Image of Ivan'
	},
	{
		id: 'ru-ru-stpetersburg-female',
		languageId: 'ru',
		region: 'Saint Petersburg',
		dialectName: 'Saint Petersburg',
		bcp47Code: 'ru-RU',
		speakerEmoji: '🌉',
		gender: 'female',
		voiceName: 'Anna',
		voiceProviderId: 'openai-anna',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/anna-speaker.webp',
		characterImageAlt: 'Image of Anna'
	},

	// --- Indonesian Speakers ---
	{
		id: 'id-id-standard-male',
		languageId: 'id',
		region: 'Indonesia',
		dialectName: 'Standard Indonesian',
		bcp47Code: 'id-ID',
		speakerEmoji: '🇮🇩',
		gender: 'male',
		voiceName: 'Budi',
		voiceProviderId: 'openai-budi',
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/budi-speaker.webp',
		characterImageAlt: 'Image of Budi'
	},
	{
		id: 'id-id-standard-female',
		languageId: 'id',
		region: 'Indonesia',
		dialectName: 'Standard Indonesian',
		bcp47Code: 'id-ID',
		speakerEmoji: '🇮🇩',
		gender: 'female',
		voiceName: 'Siti',
		voiceProviderId: 'openai-siti',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/siti-speaker.webp',
		characterImageAlt: 'Image of Siti'
	},
	{
		id: 'id-id-surabaya-male',
		languageId: 'id',
		region: 'Surabaya',
		dialectName: 'Surabaya Indonesian',
		bcp47Code: 'id-ID',
		speakerEmoji: '🦈',
		gender: 'male',
		voiceName: 'Agus',
		voiceProviderId: 'openai-agus',
		openaiVoiceId: 'ash',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/agus-speaker.webp',
		characterImageAlt: 'Image of Agus'
	},
	{
		id: 'id-id-surabaya-female',
		languageId: 'id',
		region: 'Surabaya',
		dialectName: 'Surabaya Indonesian',
		bcp47Code: 'id-ID',
		speakerEmoji: '🦈',
		gender: 'female',
		voiceName: 'Dewi',
		voiceProviderId: 'openai-dewi',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/dewi-speaker.webp',
		characterImageAlt: 'Image of Dewi'
	},

	// --- Turkish Speakers ---
	{
		id: 'tr-tr-standard-male',
		languageId: 'tr',
		region: 'Turkey',
		dialectName: 'Standard Turkish',
		bcp47Code: 'tr-TR',
		speakerEmoji: '🇹🇷',
		gender: 'male',
		voiceName: 'Ahmet',
		voiceProviderId: 'openai-ahmet',
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/ahmet-speaker.webp',
		characterImageAlt: 'Image of Ahmet'
	},
	{
		id: 'tr-tr-standard-female',
		languageId: 'tr',
		region: 'Turkey',
		dialectName: 'Standard Turkish',
		bcp47Code: 'tr-TR',
		speakerEmoji: '🇹🇷',
		gender: 'female',
		voiceName: 'Elif',
		voiceProviderId: 'openai-elif',
		openaiVoiceId: 'sage',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/elif-speaker.webp',
		characterImageAlt: 'Image of Elif'
	},
	{
		id: 'tr-tr-izmir-male',
		languageId: 'tr',
		region: 'Izmir',
		dialectName: 'Izmir Turkish',
		bcp47Code: 'tr-TR',
		speakerEmoji: '🌊',
		gender: 'male',
		voiceName: 'Can',
		voiceProviderId: 'openai-can',
		openaiVoiceId: 'alloy',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/can-speaker.webp',
		characterImageAlt: 'Image of Can'
	},
	{
		id: 'tr-tr-izmir-female',
		languageId: 'tr',
		region: 'Izmir',
		dialectName: 'Izmir Turkish',
		bcp47Code: 'tr-TR',
		speakerEmoji: '🌊',
		gender: 'female',
		voiceName: 'Ece',
		voiceProviderId: 'openai-ece',
		openaiVoiceId: 'coral',
		isActive: false,
		createdAt: null,
		characterImageUrl: '/speakers/Izmir-speaker.webp',
		characterImageAlt: 'Image of Ece'
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

// Helper function to get speaker by OpenAI voice ID
export function getSpeakerByVoiceId(voiceId: string): Speaker | undefined {
	return speakersData.find((speaker) => speaker.openaiVoiceId === voiceId);
}

// Helper function to get default speaker for a language (prioritize female speakers)
export function getDefaultSpeakerForLanguage(languageId: string): Speaker | undefined {
	const languageSpeakers = getSpeakersByLanguage(languageId);

	// First try to find a female speaker
	const femaleSpeaker = languageSpeakers.find((speaker) => speaker.gender === 'female');
	if (femaleSpeaker) {
		return femaleSpeaker;
	}

	// Fallback to first available speaker
	return languageSpeakers[0];
}

// Helper: rank speakers for a scenario and language
function scoreSpeakerForScenario(speaker: Speaker, _scenario: Scenario): number {
	let score = 0;

	// Small bonus if this is an OpenAI voice we list as common defaults
	const openaiPreferred = ['alloy', 'ash', 'sage', 'coral', 'verse', 'ballad', 'echo'];
	if (openaiPreferred.includes((speaker.openaiVoiceId || '').toLowerCase())) {
		score += 1;
	}

	return score;
}

// Get best-fitting speakers for a given scenario and language
export function getBestSpeakersForScenario(
	scenario: Scenario,
	languageId: string,
	limit = 3
): Speaker[] {
	const candidates = getSpeakersByLanguage(languageId);
	if (candidates.length === 0) return [];

	const ranked = [...candidates].sort((a, b) => {
		const sa = scoreSpeakerForScenario(a, scenario);
		const sb = scoreSpeakerForScenario(b, scenario);
		if (sb !== sa) return sb - sa;
		// Stable-ish tie-breakers: prefer active, then alphabetical voiceName
		if (a.isActive !== b.isActive) return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
		return (a.voiceName || '').localeCompare(b.voiceName || '');
	});

	return ranked.slice(0, Math.max(1, limit));
}

// Convenience: get a single top speaker for scenario + language
export function getTopSpeakerForScenario(
	scenario: Scenario,
	languageId: string
): Speaker | undefined {
	const best = getBestSpeakersForScenario(scenario, languageId, 1);
	if (best.length > 0) return best[0];
	return getDefaultSpeakerForLanguage(languageId);
}
