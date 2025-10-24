// 🌍 Enhanced Language Data
// Matches the structure from kaiwa-old with additional metadata
export type { Language } from '$lib/server/db/types';
import type { Language } from '$lib/server/db/types';

export const languages: Language[] = [
	{
		id: 'ja',
		code: 'ja',
		name: 'Japanese',
		nativeName: '日本語',
		flag: '🇯🇵',
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
		flag: '🇺🇸',
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
		flag: '🇪🇸',
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
		flag: '🇫🇷',
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
		flag: '🇩🇪',
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
		flag: '🇮🇹',
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
		flag: '🇵🇹',
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
		flag: '🇰🇷',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'korean',
		supportedScripts: ['hangul', 'hanja'],
		isSupported: true
	},
	{
		id: 'zh',
		code: 'zh',
		name: 'Chinese (Simplified)',
		nativeName: '简体中文',
		flag: '🇨🇳',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'chinese',
		supportedScripts: ['simplified'],
		isSupported: true
	},
	{
		id: 'zh-tw',
		code: 'zh-tw',
		name: 'Chinese (Traditional)',
		nativeName: '繁體中文',
		flag: '🇹🇼',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'chinese',
		supportedScripts: ['traditional'],
		isSupported: true
	},
	{
		id: 'ar',
		code: 'ar',
		name: 'Arabic',
		nativeName: 'العربية',
		flag: '🇸🇦',
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
		flag: '🇮🇳',
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
		flag: '🇷🇺',
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
		flag: '🇻🇳',
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
		flag: '🇳🇱',
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
		flag: '🇵🇭',
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
		flag: '🇮🇩',
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
		flag: '🇹🇷',
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

// Helper function to get language emoji by code
export function getLanguageEmoji(code: string): string {
	const language = getLanguageByCode(code);
	return language?.flag || '🌐';
}

// Helper function to get language name by code
export function getLanguageName(code: string): string {
	const language = getLanguageByCode(code);
	return language?.name || code.toUpperCase();
}
