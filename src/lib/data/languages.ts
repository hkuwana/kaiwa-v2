// 🌍 Enhanced Language Data
// Matches the structure from kaiwa-old with additional metadata

export interface Language {
	id: string;
	code: string;
	name: string;
	nativeName: string;
	isRTL: boolean;
	hasRomanization: boolean;
	writingSystem: string;
	supportedScripts: string[];
	isSupported: boolean;
}

export const languages: Language[] = [
	{
		id: 'ja',
		code: 'ja',
		name: 'Japanese',
		nativeName: '日本語',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'japanese',
		supportedScripts: ['hiragana', 'katakana', 'kanji'],
		isSupported: true
	},
	{
		id: 'en',
		code: 'en',
		name: 'English',
		nativeName: 'English',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'es',
		code: 'es',
		name: 'Spanish',
		nativeName: 'Español',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'fr',
		code: 'fr',
		name: 'French',
		nativeName: 'Français',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'de',
		code: 'de',
		name: 'German',
		nativeName: 'Deutsch',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'it',
		code: 'it',
		name: 'Italian',
		nativeName: 'Italiano',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'pt',
		code: 'pt',
		name: 'Portuguese',
		nativeName: 'Português',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'ko',
		code: 'ko',
		name: 'Korean',
		nativeName: '한국어',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'korean',
		supportedScripts: ['hangul', 'hanja'],
		isSupported: true
	},
	{
		id: 'zh',
		code: 'zh',
		name: 'Chinese',
		nativeName: '中文',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'chinese',
		supportedScripts: ['chinese'],
		isSupported: true
	},
	{
		id: 'ar',
		code: 'ar',
		name: 'Arabic',
		nativeName: 'العربية',
		isRTL: true,
		hasRomanization: false,
		writingSystem: 'arabic',
		supportedScripts: ['arabic'],
		isSupported: true
	},
	{
		id: 'hi',
		code: 'hi',
		name: 'Hindi',
		nativeName: 'हिन्दी',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'devanagari',
		supportedScripts: ['devanagari'],
		isSupported: true
	},
	{
		id: 'ru',
		code: 'ru',
		name: 'Russian',
		nativeName: 'Русский',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'cyrillic',
		supportedScripts: ['cyrillic'],
		isSupported: true
	},
	{
		id: 'vi',
		code: 'vi',
		name: 'Vietnamese',
		nativeName: 'Tiếng Việt',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'nl',
		code: 'nl',
		name: 'Dutch',
		nativeName: 'Nederlands',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'fil',
		code: 'fil',
		name: 'Filipino',
		nativeName: 'Filipino',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'id',
		code: 'id',
		name: 'Indonesian',
		nativeName: 'Bahasa Indonesia',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	},
	{
		id: 'tr',
		code: 'tr',
		name: 'Turkish',
		nativeName: 'Türkçe',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin'],
		isSupported: true
	}
];

// Helper function to get language by code
export function getLanguageByCode(code: string): Language | undefined {
	return languages.find((lang) => lang.code === code);
}

// Helper function to get language by id
export function getLanguageById(id: string): Language | undefined {
	return languages.find((lang) => lang.id === id);
}
